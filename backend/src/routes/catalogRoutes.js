const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireJsonAccept } = require('../middleware/contentNegotiation');
const {
  createMenuItem,
  getMenuItem,
  getMenuItems,
  changeAvailability,
  updateMenuItemHandler,
  deleteMenuItemHandler,
  catalogPayment,
  optionsMenuItems,
} = require('../controllers/catalogController');

const router = express.Router();

// OPTIONS preflight
router.options('/menu-items', optionsMenuItems);
router.options('/menu-items/:id', optionsMenuItems);
router.options('/menu-items/:id/availability', optionsMenuItems);
router.options('/catalog-payments', optionsMenuItems);

// Catalog Menu Items
router.get('/menu-items', requireJsonAccept, requireAuth, getMenuItems);
router.post('/menu-items', requireJsonAccept, requireAuth, createMenuItem);

router.get('/menu-items/:id', requireJsonAccept, requireAuth, getMenuItem);
router.put('/menu-items/:id', requireJsonAccept, requireAuth, updateMenuItemHandler);
router.delete('/menu-items/:id', requireJsonAccept, requireAuth, deleteMenuItemHandler);

router.post('/menu-items/:id/availability', requireJsonAccept, requireAuth, changeAvailability);

// Catalog Payment Proxy
router.post('/catalog-payments', requireJsonAccept, requireAuth, catalogPayment);

module.exports = router;

