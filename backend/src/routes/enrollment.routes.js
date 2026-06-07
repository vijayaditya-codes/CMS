const express = require('express');
const { enrollLearner, updateEnrollment, removeEnrollment } = require('../controllers/enrollment.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate); // All enrollment routes require authentication

router.post('/', enrollLearner);
router.put('/:id', updateEnrollment);
router.delete('/:id', removeEnrollment);

module.exports = router;
