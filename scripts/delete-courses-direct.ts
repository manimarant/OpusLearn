import { db } from '../server/db';
import { courses, courseModules, chapters, assignments, discussions, quizzes, enrollments } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';

const KEEP_COURSE_IDS = [20, 21, 24];

async function deleteCoursesDirect() {
  console.log('Starting direct course deletion...');
  console.log('Keeping courses with IDs:', KEEP_COURSE_IDS);
  
  try {
    // Get all course IDs
    const allCourses = await db.select({ id: courses.id, title: courses.title }).from(courses);
    console.log('All courses:', allCourses);
    
    const courseIds = allCourses.map(c => c.id);
    
    // Filter out the ones to keep
    const coursesToDelete = courseIds.filter(id => !KEEP_COURSE_IDS.includes(id));
    
    console.log('Courses to delete:', coursesToDelete);
    
    if (coursesToDelete.length === 0) {
      console.log('No courses to delete');
      return;
    }
    
    // Delete related data first (cascade delete)
    for (const courseId of coursesToDelete) {
      console.log(`Deleting course ${courseId}...`);
      
      try {
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
        console.log(`✅ Deleted course ${courseId}`);
        
      } catch (error) {
        console.error(`❌ Error deleting course ${courseId}:`, error);
      }
    }
    
    console.log('✅ Course deletion completed!');
    
    // Show remaining courses
    const remainingCourses = await db.select({ id: courses.id, title: courses.title }).from(courses);
    console.log('Remaining courses:', remainingCourses);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteCoursesDirect(); 