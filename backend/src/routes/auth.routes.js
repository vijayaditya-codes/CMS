const express = require('express');
const { login, refresh, register } = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/register', authenticate, requireRole(['ADMIN']), register);

module.exports = router;
