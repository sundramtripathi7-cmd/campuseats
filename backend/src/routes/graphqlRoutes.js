const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireJsonAccept } = require('../middleware/contentNegotiation');
const { handleGraphQL } = require('../controllers/graphqlController');
const { optionsMenuItems } = require('../controllers/catalogController');

const router = express.Router();

router.options('/graphql', optionsMenuItems);
router.post('/graphql', requireJsonAccept, requireAuth, handleGraphQL);

module.exports = router;

