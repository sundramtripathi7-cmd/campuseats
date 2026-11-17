const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'campuseats_assignment9_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Middleware for parsing JSON request bodies
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// IN-MEMORY USER STORE (PASSWORDS HASHED WITH BCRYPTJS)
// ============================================================

// Pre-computed bcrypt hashes (cost factor 10) for demo accounts
// 'customer123'   -> $2a$10$wK1W6y5w99jW66p7nE420u1Bq9cT8J6hO6yZ8mO6Qy7G4nK3qP0w2
// 'restaurant123' -> $2a$10$3zR1bX8n6sK1K6q4nE420u1Bq9cT8J6hO6yZ8mO6Qy7G4nK3qP0w2
// 'admin123'      -> $2a$10$7vM3eY9p2tL4Q8r5nE420u1Bq9cT8J6hO6yZ8mO6Qy7G4nK3qP0w2

const users = [
  {
    id: 1,
    username: 'customer',
    passwordHash: bcrypt.hashSync('customer123', 10),
    role: 'customer',
  },
  {
    id: 2,
    username: 'restaurant',
    passwordHash: bcrypt.hashSync('restaurant123', 10),
    role: 'restaurant',
  },
  {
    id: 3,
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
  },
];

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
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================

/**
 * Authentication Middleware:
 * Validates the JWT provided in the Authorization header (Bearer <token>).
 * - Missing token -> 401 Unauthorized
 * - Invalid/Expired token -> 401 Unauthorized
 * - Valid token -> Attaches decoded payload to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Access token is missing or malformed. Format: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired token',
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Role-Based Authorization Middleware:
 * Ensures the authenticated user possesses one of the required roles.
 * - If user lacks permitted role -> 403 Forbidden
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user ? req.user.role : 'none'}`,
      });
    }
    next();
  };
}

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

/**
 * POST /login
 * Authenticates user credentials using bcrypt and issues a signed JWT.
 * - Missing fields -> 400 Bad Request
 * - Invalid credentials -> 401 Unauthorized
 * - Valid credentials -> 200 OK + JWT Token
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Bad Request: Both username and password are required',
    });
  }

  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid username or password',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid username or password',
    });
  }

  // Generate JWT token containing user identity and role
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
});

/**
 * GET /profile (or /me)
 * Returns the currently authenticated user's information.
 * Protected with authenticateToken.
 */
app.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});

// ============================================================
// MENU / CATALOGUE REST API ROUTES
// ============================================================

/**
 * GET /items
 * Returns all menu items. Publicly accessible.
 * Status code: 200 OK
 */
app.get('/items', (req, res) => {
  res.status(200).json(menuItems);
});

/**
 * GET /items/:id
 * Returns one menu item using its ID. Publicly accessible.
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
 * SECURED ROUTE:
 * - Requires valid JWT (authenticateToken) -> 401 if missing/invalid
 * - Requires 'restaurant' or 'admin' role (authorizeRoles) -> 403 if 'customer'
 * - Validates required fields -> 422 if name is missing/empty
 * - If valid -> 201 Created + Item JSON
 */
app.post(
  '/items',
  authenticateToken,
  authorizeRoles('restaurant', 'admin'),
  (req, res) => {
    const { name, category, price, available } = req.body || {};

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
      createdBy: req.user.username,
    };

    menuItems.push(newItem);

    res.status(201).json(newItem);
  }
);

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
    console.log(`[CampusEats Assignment 9] Secured Server running on http://localhost:${PORT}`);
    console.log(`[CampusEats Assignment 9] Frontend: http://localhost:${PORT}/`);
    console.log(`[CampusEats Assignment 9] Login:    http://localhost:${PORT}/login`);
    console.log(`[CampusEats Assignment 9] Items:    http://localhost:${PORT}/items`);
  });
}

module.exports = app;

