const express = require('express');
const { getStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats', authenticate, getStats);

module.exports = router;
