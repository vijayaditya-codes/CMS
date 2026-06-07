const prisma = require('../utils/prisma');

const enrollLearner = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { learnerId, courseId } = req.body;

    if (!learnerId || !courseId) {
      return res.status(400).json({ message: 'learnerId and courseId are required' });
    }

    // Verify learner exists
    const learner = await prisma.learner.findUnique({ where: { id: learnerId } });
    if (!learner) {
      return res.status(404).json({ message: 'Learner not found' });
    }

    // Verify course exists and retrieve capacity & current enrollment count
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructors can only enroll learners in courses they own
    if (role === 'INSTRUCTOR' && course.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not instruct this course' });
    }

    // Check course capacity limit
    if (course._count.enrollments >= course.capacity) {
      return res.status(400).json({ message: 'Course capacity reached' });
    }

    // Check for existing enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        learnerId_courseId: {
          learnerId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Learner is already enrolled in this course' });
    }

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        learnerId,
        courseId,
        status: 'ACTIVE',
        progressPercent: 0,
      },
      include: {
        learner: true,
        course: true,
      },
    });

    return res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
};

const updateEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { status, progressPercent } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Instructors can only modify enrollments for courses they instruct
    if (role === 'INSTRUCTOR' && enrollment.course.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not instruct this course' });
    }

    const updateData = {};
    if (status !== undefined) {
      if (!['ACTIVE', 'DROPPED', 'COMPLETED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be ACTIVE, DROPPED, or COMPLETED' });
      }
      updateData.status = status;
    }

    if (progressPercent !== undefined) {
      const progress = parseInt(progressPercent);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return res.status(400).json({ message: 'Progress percent must be an integer between 0 and 100' });
      }
      updateData.progressPercent = progress;
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        learner: true,
        course: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

const removeEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Instructors can only drop/delete enrollments for courses they instruct
    if (role === 'INSTRUCTOR' && enrollment.course.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not instruct this course' });
    }

    await prisma.enrollment.delete({ where: { id } });

    return res.status(200).json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollLearner,
  updateEnrollment,
  removeEnrollment,
};
