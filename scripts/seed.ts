// Seed script for populating users, courses, discussions, and assignments
import { storage } from '../server/storage';
import { db } from '../server/db';

async function main() {
  // 1. Create users
  const instructor = await storage.upsertUser({
    id: 'dev-user-123', // Changed to match mock user ID
    email: 'dev@example.com',
    firstName: 'Development',
    lastName: 'User',
    profileImageUrl: null,
    role: 'instructor',
  });

  const instructor2 = await storage.upsertUser({
    id: 'instructor-2',
    email: 'instructor2@example.com',
    firstName: 'Bob',
    lastName: 'Teacher',
    profileImageUrl: null,
    role: 'instructor',
  });

  const student = await storage.upsertUser({
    id: 'student-1',
    email: 'student1@example.com',
    firstName: 'Charlie',
    lastName: 'Student',
    profileImageUrl: null,
    role: 'student',
  });

  // 2. Create courses
  const courses = [
    {
      title: 'Introduction to Programming',
      description: 'Learn the fundamentals of programming with Python. Perfect for beginners!',
      category: 'Programming',
      difficulty: 'beginner',
      instructorId: instructor.id,
      status: 'published',
      thumbnail: null,
    },
    {
      title: 'Web Development Bootcamp',
      description: 'Master HTML, CSS, and JavaScript to build modern web applications.',
      category: 'Web Development',
      difficulty: 'intermediate',
      instructorId: instructor.id,
      status: 'published',
      thumbnail: null,
    },
    {
      title: 'Data Science Fundamentals',
      description: 'Introduction to data analysis, visualization, and machine learning basics.',
      category: 'Data Science',
      difficulty: 'intermediate',
      instructorId: instructor2.id,
      status: 'published',
      thumbnail: null,
    },
    {
      title: 'Advanced Database Systems',
      description: 'Deep dive into database design, optimization, and administration.',
      category: 'Databases',
      difficulty: 'advanced',
      instructorId: instructor2.id,
      status: 'published',
      thumbnail: null,
    },
    {
      title: 'Mobile App Development',
      description: 'Learn to build iOS and Android apps using React Native.',
      category: 'Mobile Development',
      difficulty: 'intermediate',
      instructorId: instructor.id,
      status: 'published',
      thumbnail: null,
    }
  ];

  // Create all courses and store their IDs
  const createdCourses = await Promise.all(
    courses.map(course => storage.createCourse(course))
  );

  // 3. Create discussions for each course
  for (const course of createdCourses) {
    // Welcome discussion by instructor
    await storage.createDiscussion({
      courseId: course.id,
      userId: course.instructorId,
      title: 'Welcome to the course!',
      content: 'Welcome everyone! I am excited to have you in this course. Please introduce yourself and share what you hope to learn.',
      pinned: true,
      locked: false,
    });

    // Sample student discussion
    await storage.createDiscussion({
      courseId: course.id,
      userId: student.id,
      title: 'Study group for weekly assignments',
      content: 'Would anyone be interested in forming a study group to work on assignments together?',
      pinned: false,
      locked: false,
    });
  }

  // 4. Create assignments for each course
  const assignmentTemplates = [
    {
      title: 'Getting Started Project',
      description: 'Your first hands-on project in the course.',
      dueInDays: 7,
    },
    {
      title: 'Mid-term Project',
      description: 'Apply what you have learned in the first half of the course.',
      dueInDays: 14,
    },
    {
      title: 'Final Project',
      description: 'Demonstrate your mastery of the course material.',
      dueInDays: 21,
    }
  ];

  for (const course of createdCourses) {
    for (const template of assignmentTemplates) {
      await storage.createAssignment({
        courseId: course.id,
        title: `${template.title}: ${course.title}`,
        description: template.description,
        instructions: 'Complete this project based on the course materials. Refer to the course lectures and readings for guidance.',
        dueDate: new Date(Date.now() + template.dueInDays * 24 * 60 * 60 * 1000),
        maxPoints: 100,
        status: 'active',
      });
    }
  }

  console.log('Seed data inserted successfully!');
  if (db.pool) await db.pool.end();
}

main().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
}); 