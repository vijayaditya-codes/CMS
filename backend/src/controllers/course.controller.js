const prisma = require('../utils/prisma');

const getCourses = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { page = 1, limit = 10, search = '', status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query conditions
    const where = {};

    // Instructors can only access their own courses
    if (role === 'INSTRUCTOR') {
      where.instructorId = userId;
    }

    // Optional status filter
    if (status && ['DRAFT', 'PUBLISHED'].includes(status)) {
      where.status = status;
    }

    // Optional text search filter (on title, description, or category)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Retrieve courses with their instructor's name and enrollment counts
    const courses = await prisma.course.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return res.status(200).json({
      courses,
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

const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            learner: {
              select: {
                id: true,
                name: true,
                email: true,
                cohort: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructors can only view their own courses
    if (role === 'INSTRUCTOR' && course.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this course' });
    }

    return res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { title, description, category, status, capacity, instructorId } = req.body;

    if (!title || !category || capacity === undefined) {
      return res.status(400).json({ message: 'Title, category, and capacity are required' });
    }

    // Determine instructor ownership
    let finalInstructorId = userId;
    if (role === 'ADMIN' && instructorId) {
      // Admin can assign this course to another instructor
      const instructorExists = await prisma.user.findUnique({ where: { id: instructorId } });
      if (!instructorExists) {
        return res.status(400).json({ message: 'Assigned instructor does not exist' });
      }
      finalInstructorId = instructorId;
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || '',
        category,
        status: status || 'DRAFT',
        capacity: parseInt(capacity),
        instructorId: finalInstructorId,
      },
      include: {
        instructor: {
          select: { name: true, email: true },
        },
      },
    });

    return res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const { title, description, category, status, capacity, instructorId } = req.body;

    const courseExists = await prisma.course.findUnique({ where: { id } });
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructors can only update their own courses
    if (role === 'INSTRUCTOR' && courseExists.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this course' });
    }

    // Build update parameters
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);

    if (role === 'ADMIN' && instructorId !== undefined) {
      const instructorExists = await prisma.user.findUnique({ where: { id: instructorId } });
      if (!instructorExists) {
        return res.status(400).json({ message: 'Assigned instructor does not exist' });
      }
      updateData.instructorId = instructorId;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        instructor: {
          select: { name: true, email: true },
        },
      },
    });

    return res.status(200).json(updatedCourse);
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const courseExists = await prisma.course.findUnique({ where: { id } });
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Instructors can only delete their own courses
    if (role === 'INSTRUCTOR' && courseExists.instructorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this course' });
    }

    await prisma.course.delete({ where: { id } });

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
