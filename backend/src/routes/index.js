const express = require('express');
const catalogRoutes = require('./catalogRoutes');
const graphqlRoutes = require('./graphqlRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/', graphqlRoutes);
router.use('/', orderRoutes);
router.use('/', paymentRoutes);

module.exports = router;

