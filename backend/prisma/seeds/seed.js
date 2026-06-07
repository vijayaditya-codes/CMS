const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in reverse order of dependencies to avoid foreign key violations
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.learner.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding roles and users...');
  
  // Hashed password for test users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cms.com',
      name: 'Alice Admin',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  // Create Instructor
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@cms.com',
      name: 'Bob Instructor',
      passwordHash: passwordHash,
      role: 'INSTRUCTOR',
    },
  });

  console.log('Seeding learners...');
  const learner1 = await prisma.learner.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      skillLevel: 'BEGINNER',
      cohort: '2026-Q1',
    },
  });

  const learner2 = await prisma.learner.create({
    data: {
      name: 'John Smith',
      email: 'john@example.com',
      skillLevel: 'INTERMEDIATE',
      cohort: '2026-Q1',
    },
  });

  const learner3 = await prisma.learner.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      skillLevel: 'ADVANCED',
      cohort: '2026-Q2',
    },
  });

  console.log('Seeding courses...');
  const course1 = await prisma.course.create({
    data: {
      title: 'Introduction to React & Next.js',
      description: 'Learn the fundamentals of building modern web applications with React and Next.js App Router.',
      category: 'Frontend Development',
      status: 'PUBLISHED',
      capacity: 25,
      instructorId: instructor.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Advanced API Design with Node.js',
      description: 'Master Express, middleware, request parsing, database integration, and micro-optimization strategies.',
      category: 'Backend Development',
      status: 'PUBLISHED',
      capacity: 15,
      instructorId: instructor.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Systems Design & Scalability (Draft)',
      description: 'Introduction to load balancers, database sharding, caching strategies, and system design patterns.',
      category: 'Systems',
      status: 'DRAFT',
      capacity: 50,
      instructorId: admin.id,
    },
  });

  console.log('Seeding enrollments...');
  await prisma.enrollment.createMany({
    data: [
      {
        learnerId: learner1.id,
        courseId: course1.id,
        status: 'ACTIVE',
        progressPercent: 45,
      },
      {
        learnerId: learner2.id,
        courseId: course1.id,
        status: 'COMPLETED',
        progressPercent: 100,
      },
      {
        learnerId: learner2.id,
        courseId: course2.id,
        status: 'ACTIVE',
        progressPercent: 12,
      },
      {
        learnerId: learner3.id,
        courseId: course2.id,
        status: 'DROPPED',
        progressPercent: 0,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
