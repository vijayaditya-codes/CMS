const prisma = require('../utils/prisma');

const getLearners = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query conditions
    const where = {};

    // Instructors can only view learners enrolled in their courses
    if (role === 'INSTRUCTOR') {
      where.enrollments = {
        some: {
          course: {
            instructorId: userId,
          },
        },
      };
    }

    // Optional text search filter (on name, email, or cohort)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cohort: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.learner.count({ where });

    // Retrieve learners with enrollment statuses
    const learners = await prisma.learner.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      learners,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getLearnerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const learner = await prisma.learner.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!learner) {
      return res.status(404).json({ message: 'Learner not found' });
    }

    // Instructors can only view details of learners enrolled in their courses
    if (role === 'INSTRUCTOR') {
      const isEnrolledInInstructorCourse = learner.enrollments.some(
        (e) => e.course.instructorId === userId
      );
      if (!isEnrolledInInstructorCourse) {
        return res.status(403).json({ message: 'Forbidden: You do not instruct this learner' });
      }
    }

    return res.status(200).json(learner);
  } catch (error) {
    next(error);
  }
};

const createLearner = async (req, res, next) => {
  try {
    const { name, email, skillLevel, cohort } = req.body;

    if (!name || !email || !skillLevel || !cohort) {
      return res.status(400).json({ message: 'All fields (name, email, skillLevel, cohort) are required' });
    }

    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(skillLevel)) {
      return res.status(400).json({ message: 'Invalid skillLevel. Must be BEGINNER, INTERMEDIATE, or ADVANCED' });
    }

    const existingLearner = await prisma.learner.findUnique({ where: { email } });
    if (existingLearner) {
      return res.status(400).json({ message: 'Learner with this email already exists' });
    }

    const learner = await prisma.learner.create({
      data: {
        name,
        email,
        skillLevel,
        cohort,
      },
    });

    return res.status(201).json(learner);
  } catch (error) {
    next(error);
  }
};

const updateLearner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, skillLevel, cohort } = req.body;

    const learnerExists = await prisma.learner.findUnique({ where: { id } });
    if (!learnerExists) {
      return res.status(404).json({ message: 'Learner not found' });
    }

    if (email && email !== learnerExists.email) {
      const emailTaken = await prisma.learner.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ message: 'Learner with this email already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (skillLevel !== undefined) {
      if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(skillLevel)) {
        return res.status(400).json({ message: 'Invalid skillLevel. Must be BEGINNER, INTERMEDIATE, or ADVANCED' });
      }
      updateData.skillLevel = skillLevel;
    }
    if (cohort !== undefined) updateData.cohort = cohort;

    const updatedLearner = await prisma.learner.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json(updatedLearner);
  } catch (error) {
    next(error);
  }
};

const deleteLearner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const learnerExists = await prisma.learner.findUnique({ where: { id } });
    if (!learnerExists) {
      return res.status(404).json({ message: 'Learner not found' });
    }

    await prisma.learner.delete({ where: { id } });

    return res.status(200).json({ message: 'Learner deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLearners,
  getLearnerById,
  createLearner,
  updateLearner,
  deleteLearner,
};
