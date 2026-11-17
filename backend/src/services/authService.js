const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPool, isUsingMySQL } = require('../config/db');

let inMemoryUsers = new Map();
let nextUserId = 1;

async function registerUser({ name, email, password, role = 'student' }) {
  const normalizedEmail = email.toLowerCase().trim();
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (existing.length > 0) {
        const err = new Error('User with this email already exists');
        err.status = 409;
        throw err;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name.trim(), normalizedEmail, hashedPassword, role.toLowerCase()]
      );

      const userId = result.insertId;
      const user = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: role.toLowerCase(),
      };

      const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      return { user, token };
    } catch (err) {
      if (err.status) throw err;
      console.warn(`[AuthService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  // Memory fallback
  for (const u of inMemoryUsers.values()) {
    if (u.email === normalizedEmail) {
      const err = new Error('User with this email already exists');
      err.status = 409;
      throw err;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = nextUserId++;
  const userRecord = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: role.toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.set(userId, userRecord);

  const user = {
    id: userId,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
  };

  const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { user, token };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const pool = await getPool();

  let userRecord = null;

  if (isUsingMySQL() && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
      if (rows.length > 0) {
        userRecord = rows[0];
      }
    } catch (err) {
      console.warn(`[AuthService] MySQL query failed: ${err.message}. Using memory store.`);
    }
  }

  if (!userRecord) {
    for (const u of inMemoryUsers.values()) {
      if (u.email === normalizedEmail) {
        userRecord = u;
        break;
      }
    }
  }

  if (!userRecord) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const isValidPassword = await bcrypt.compare(password, userRecord.password);
  if (!isValidPassword) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    role: userRecord.role,
  };

  const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { user, token };
}

async function getUserById(id) {
  const numId = parseInt(id, 10);
  const pool = await getPool();

  if (isUsingMySQL() && pool) {
    try {
      const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [numId]);
      if (rows.length > 0) return rows[0];
    } catch (err) {}
  }

  const user = inMemoryUsers.get(numId);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function clearUsers() {
  inMemoryUsers.clear();
  nextUserId = 1;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  clearUsers,
};

