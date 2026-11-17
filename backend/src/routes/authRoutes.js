const express = require('express');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  register,
  login,
  getMe,
  uploadDocument,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/upload', requireAuth, upload.single('file'), uploadDocument);

module.exports = router;

