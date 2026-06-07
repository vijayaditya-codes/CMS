const express = require('express');
const { getLearners, getLearnerById, createLearner, updateLearner, deleteLearner } = require('../controllers/learner.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate); // All learner routes require authentication

router.get('/', getLearners);
router.get('/:id', getLearnerById);

// Restricted to Admins only
router.post('/', requireRole(['ADMIN']), createLearner);
router.put('/:id', requireRole(['ADMIN']), updateLearner);
router.delete('/:id', requireRole(['ADMIN']), deleteLearner);

module.exports = router;
