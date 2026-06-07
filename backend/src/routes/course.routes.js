const express = require('express');
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/course.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate); // All course routes require authentication

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router;
