import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { courses, courseModules, chapters, assignments, discussions, quizzes, enrollments } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/opuslearn';
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function deleteCoursesExcept(keepIds: number[]) {
  console.log('Starting course deletion...');
  console.log('Keeping courses with IDs:', keepIds);
  
  try {
    // Get all course IDs
    const allCourses = await db.select({ id: courses.id }).from(courses);
    const courseIds = allCourses.map(c => c.id);
    
    console.log('All course IDs:', courseIds);
    
    // Filter out the ones to keep
    const coursesToDelete = courseIds.filter(id => !keepIds.includes(id));
    
    console.log('Courses to delete:', coursesToDelete);
    
    if (coursesToDelete.length === 0) {
      console.log('No courses to delete');
      return;
    }
    
    // Delete related data first (cascade delete)
    for (const courseId of coursesToDelete) {
      console.log(`Deleting course ${courseId}...`);
      
      // Delete chapters (via modules)
      const modules = await db.select({ id: courseModules.id }).from(courseModules).where(eq(courseModules.courseId, courseId));
      const moduleIds = modules.map(m => m.id);
      
      if (moduleIds.length > 0) {
        await db.delete(chapters).where(inArray(chapters.moduleId, moduleIds));
        console.log(`Deleted chapters for course ${courseId}`);
      }
      
      // Delete modules
      await db.delete(courseModules).where(eq(courseModules.courseId, courseId));
      console.log(`Deleted modules for course ${courseId}`);
      
      // Delete assignments
      await db.delete(assignments).where(eq(assignments.courseId, courseId));
      console.log(`Deleted assignments for course ${courseId}`);
      
      // Delete discussions
      await db.delete(discussions).where(eq(discussions.courseId, courseId));
      console.log(`Deleted discussions for course ${courseId}`);
      
      // Delete quizzes
      await db.delete(quizzes).where(eq(quizzes.courseId, courseId));
      console.log(`Deleted quizzes for course ${courseId}`);
      
      // Delete enrollments
      await db.delete(enrollments).where(eq(enrollments.courseId, courseId));
      console.log(`Deleted enrollments for course ${courseId}`);
      
      // Finally delete the course
      await db.delete(courses).where(eq(courses.id, courseId));
      console.log(`Deleted course ${courseId}`);
    }
    
    console.log('✅ Course deletion completed successfully!');
    
    // Show remaining courses
    const remainingCourses = await db.select({ id: courses.id, title: courses.title }).from(courses);
    console.log('Remaining courses:', remainingCourses);
    
  } catch (error) {
    console.error('Error deleting courses:', error);
  } finally {
    await pool.end();
  }
}

// Delete all courses except 20, 21, and 24
deleteCoursesExcept([20, 21, 24]); 