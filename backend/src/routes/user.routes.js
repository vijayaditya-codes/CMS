const express = require('express');
const { getInstructors } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/instructors', authenticate, getInstructors);

module.exports = router;
