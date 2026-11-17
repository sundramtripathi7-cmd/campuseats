const config = require('../config/env');
const { getPool, isUsingMySQL } = require('../config/db');

// In-memory store for test environment or when MySQL is unavailable
let menuItems = new Map();
let nextId = 1;
const idempotencyResults = new Map();

async function createItem(item) {
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [result] = await pool.query(
        'INSERT INTO menu_items (name, category, price, available) VALUES (?, ?, ?, ?)',
        [item.name, item.category, item.price, item.available]
      );
      const insertedId = result.insertId;
      const [rows] = await pool.query(
        'SELECT id, name, category, price, available FROM menu_items WHERE id = ?',
        [insertedId]
      );
      const row = rows[0];
      return {
        id: String(row.id),
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        available: Boolean(row.available),
      };
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  // In-memory fallback
  const itemId = String(nextId++);
  const newItem = {
    id: itemId,
    name: item.name,
    category: item.category,
    price: parseFloat(item.price),
    available: Boolean(item.available),
  };
  menuItems.set(itemId, newItem);
  return { ...newItem };
}

async function getItem(itemId) {
  const idStr = String(itemId);
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [rows] = await pool.query(
        'SELECT id, name, category, price, available FROM menu_items WHERE id = ?',
        [idStr]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: String(row.id),
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        available: Boolean(row.available),
      };
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  const item = menuItems.get(idStr);
  return item ? { ...item } : null;
}

async function listItems(category = null) {
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      let query = 'SELECT id, name, category, price, available FROM menu_items';
      const params = [];
      if (category) {
        query += ' WHERE LOWER(category) = LOWER(?)';
        params.push(category);
      }
      query += ' ORDER BY id';
      const [rows] = await pool.query(query, params);
      return rows.map(row => ({
        id: String(row.id),
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        available: Boolean(row.available),
      }));
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  let items = Array.from(menuItems.values());
  if (category) {
    items = items.filter(
      item => item.category.toLowerCase() === category.toLowerCase()
    );
  }
  return items.map(item => ({ ...item }));
}

async function updateAvailability(itemId, available) {
  const idStr = String(itemId);
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [res] = await pool.query(
        'UPDATE menu_items SET available = ? WHERE id = ?',
        [available, idStr]
      );
      if (res.affectedRows === 0) {
        const existing = await getItem(idStr);
        if (!existing) return null;
      }
      return await getItem(idStr);
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  const item = menuItems.get(idStr);
  if (!item) return null;
  item.available = Boolean(available);
  return { ...item };
}

async function updateItem(itemId, updatedData) {
  const idStr = String(itemId);
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [res] = await pool.query(
        'UPDATE menu_items SET name = ?, category = ?, price = ?, available = ? WHERE id = ?',
        [updatedData.name, updatedData.category, updatedData.price, updatedData.available, idStr]
      );
      if (res.affectedRows === 0) return null;
      return await getItem(idStr);
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  const item = menuItems.get(idStr);
  if (!item) return null;
  Object.assign(item, updatedData);
  return { ...item };
}

async function deleteItem(itemId) {
  const idStr = String(itemId);
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [res] = await pool.query('DELETE FROM menu_items WHERE id = ?', [idStr]);
      return res.affectedRows > 0;
    } catch (err) {
      console.warn(`[CatalogService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  return menuItems.delete(idStr);
}

function getIdempotencyResult(key) {
  return idempotencyResults.get(key) || null;
}

function saveIdempotencyResult(key, result) {
  idempotencyResults.set(key, result);
}

function clearStore() {
  menuItems.clear();
  idempotencyResults.clear();
  nextId = 1;
}

/**
 * Proxy call to Payment Service with bounded retries and exponential backoff
 */
async function createCatalogPayment(paymentData, idempotencyKey) {
  const paymentsUrl = config.paymentsUrl;
  if (!paymentsUrl) return null;

  const url = `${paymentsUrl.replace(/\/+$/, '')}/payments`;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Client error (4xx) is domain failure, never retry
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Successful or redirect (< 500)
      if (response.status < 500) {
        return response;
      }
    } catch (err) {
      // Network error, timeout, or aborted
    }

    if (attempt < maxAttempts - 1) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

module.exports = {
  createItem,
  getItem,
  listItems,
  updateAvailability,
  updateItem,
  deleteItem,
  getIdempotencyResult,
  saveIdempotencyResult,
  clearStore,
  createCatalogPayment,
};

