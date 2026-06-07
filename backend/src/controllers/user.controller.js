const prisma = require('../utils/prisma');

const getInstructors = async (req, res, next) => {
  try {
    const instructors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(instructors);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInstructors,
};
