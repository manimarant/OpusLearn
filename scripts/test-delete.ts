import { db } from '../server/db';
import { courses, courseModules, chapters, assignments, discussions, quizzes, enrollments } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';

async function testDelete() {
  const courseId = 30;
  
  try {
    console.log(`Testing deletion of course ${courseId}...`);
    
    // Check if course exists
    const course = await db.select().from(courses).where(eq(courses.id, courseId));
    console.log('Course exists:', course.length > 0);
    
    if (course.length === 0) {
      console.log('Course not found');
      return;
    }
    
    // Get module IDs
    const moduleIds = await db.select({ id: courseModules.id }).from(courseModules).where(eq(courseModules.courseId, courseId));
    console.log('Module IDs:', moduleIds.map(m => m.id));
    
    // Delete chapters
    if (moduleIds.length > 0) {
      const ids = moduleIds.map(m => m.id);
      const deletedChapters = await db.delete(chapters).where(inArray(chapters.moduleId, ids));
      console.log('Deleted chapters:', deletedChapters);
    }
    
    // Delete modules
    const deletedModules = await db.delete(courseModules).where(eq(courseModules.courseId, courseId));
    console.log('Deleted modules:', deletedModules);
    
    // Delete other related data
    await db.delete(assignments).where(eq(assignments.courseId, courseId));
    await db.delete(discussions).where(eq(discussions.courseId, courseId));
    await db.delete(quizzes).where(eq(quizzes.courseId, courseId));
    await db.delete(enrollments).where(eq(enrollments.courseId, courseId));
    
    // Delete course
    const deletedCourse = await db.delete(courses).where(eq(courses.id, courseId));
    console.log('Deleted course:', deletedCourse);
    
    console.log('✅ Course deletion test completed successfully');
    
  } catch (error) {
    console.error('❌ Error during deletion test:', error);
  }
}

testDelete(); 