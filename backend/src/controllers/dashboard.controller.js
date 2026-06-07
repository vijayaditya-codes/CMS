const prisma = require('../utils/prisma');

const getStats = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    // Base conditions depending on role
    const courseWhere = role === 'INSTRUCTOR' ? { instructorId: userId } : {};
    const enrollmentWhere = role === 'INSTRUCTOR' ? { course: { instructorId: userId } } : {};

    // 1. Total Courses Count
    const totalCourses = await prisma.course.count({
      where: courseWhere,
    });

    // 2. Active Learners Count (Unique learners with active enrollments)
    const activeLearnersCount = await prisma.learner.count({
      where: {
        enrollments: {
          some: {
            status: 'ACTIVE',
            ...enrollmentWhere,
          },
        },
      },
    });

    // 3. Average Completion Rate (Average progress of all enrollments)
    const averageProgressAggregation = await prisma.enrollment.aggregate({
      _avg: {
        progressPercent: true,
      },
      where: enrollmentWhere,
    });

    // Ensure we default to 0 if there are no enrollments
    const averageCompletionRate = Math.round(averageProgressAggregation._avg.progressPercent || 0);

    return res.status(200).json({
      totalCourses,
      activeLearners: activeLearnersCount,
      averageCompletionRate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
