const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for menu items
let menuItems = [
  { id: 1, name: 'Veg Burger', category: 'Fast Food', price: 80.0, available: true },
  { id: 2, name: 'Paneer Roll', category: 'Rolls', price: 100.0, available: true },
  { id: 3, name: 'Masala Chai', category: 'Beverages', price: 20.0, available: true },
  { id: 4, name: 'Cold Coffee', category: 'Beverages', price: 60.0, available: false },
  { id: 5, name: 'Samosa (2 pcs)', category: 'Snacks', price: 30.0, available: true },
];

let nextId = 6;

// ============================================================
// REST API ROUTES
// ============================================================

/**
 * GET /items
 * Returns all menu items.
 * Status code: 200 OK
 */
app.get('/items', (req, res) => {
  res.status(200).json(menuItems);
});

/**
 * GET /items/:id
 * Returns one menu item using its ID.
 * Status code: 200 OK if found, 404 Not Found if missing.
 */
app.get('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);

  if (isNaN(itemId)) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  const item = menuItems.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  res.status(200).json(item);
});

/**
 * POST /items
 * Creates a new menu item.
 * Reads data from req.body.
 * Validates required fields:
 * - If name is missing, returns status 422 Unprocessable Entity.
 * - If valid, creates the item, returns status 201 Created and the created item as JSON.
 */
app.post('/items', (req, res) => {
  const { name, category, price, available } = req.body;

  // Validation: name is strictly required
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({
      error: 'Validation failed: name is required and cannot be empty',
    });
  }

  // Parse and validate price
  const parsedPrice = price !== undefined && price !== '' ? parseFloat(price) : 0.0;
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(422).json({
      error: 'Validation failed: price must be a non-negative number',
    });
  }

  const newItem = {
    id: nextId++,
    name: name.trim(),
    category: (category && typeof category === 'string' && category.trim()) ? category.trim() : 'General',
    price: parsedPrice,
    available: available !== undefined ? Boolean(available) : true,
  };

  menuItems.push(newItem);

  res.status(201).json(newItem);
});

// Helper for testing reset
app.resetStore = function () {
  menuItems = [
    { id: 1, name: 'Veg Burger', category: 'Fast Food', price: 80.0, available: true },
    { id: 2, name: 'Paneer Roll', category: 'Rolls', price: 100.0, available: true },
    { id: 3, name: 'Masala Chai', category: 'Beverages', price: 20.0, available: true },
    { id: 4, name: 'Cold Coffee', category: 'Beverages', price: 60.0, available: false },
    { id: 5, name: 'Samosa (2 pcs)', category: 'Snacks', price: 30.0, available: true },
  ];
  nextId = 6;
};

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CampusEats Assignment 8] Server running on http://localhost:${PORT}`);
    console.log(`[CampusEats Assignment 8] Frontend: http://localhost:${PORT}/`);
    console.log(`[CampusEats Assignment 8] API:      http://localhost:${PORT}/items`);
  });
}

module.exports = app;

