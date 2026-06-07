const express = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const userRoutes = require('./user.routes');
const learnerRoutes = require('./learner.routes');
const enrollmentRoutes = require('./enrollment.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/users', userRoutes);
router.use('/learners', learnerRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
