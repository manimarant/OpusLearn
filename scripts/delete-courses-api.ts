// Script to delete all courses except the specified ones using the API
const KEEP_COURSE_IDS = [20, 21, 24];

async function deleteCoursesViaAPI() {
  console.log('Starting course deletion via API...');
  console.log('Keeping courses with IDs:', KEEP_COURSE_IDS);
  
  try {
    // Get all courses
    const response = await fetch('http://localhost:3000/api/courses');
    const courses = await response.json();
    
    console.log('All course IDs:', courses.map((c: any) => c.id));
    
    // Filter out the ones to keep
    const coursesToDelete = courses
      .filter((course: any) => !KEEP_COURSE_IDS.includes(course.id))
      .map((course: any) => course.id);
    
    console.log('Courses to delete:', coursesToDelete);
    
    if (coursesToDelete.length === 0) {
      console.log('No courses to delete');
      return;
    }
    
    // Delete each course
    for (const courseId of coursesToDelete) {
      console.log(`Deleting course ${courseId}...`);
      
      try {
        const deleteResponse = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Successfully deleted course ${courseId}`);
        } else {
          const errorData = await deleteResponse.json();
          console.log(`❌ Failed to delete course ${courseId}:`, errorData.message);
        }
      } catch (error) {
        console.log(`❌ Error deleting course ${courseId}:`, error);
      }
    }
    
    console.log('✅ Course deletion completed!');
    
    // Show remaining courses
    const remainingResponse = await fetch('http://localhost:3000/api/courses');
    const remainingCourses = await remainingResponse.json();
    console.log('Remaining courses:', remainingCourses.map((c: any) => ({ id: c.id, title: c.title })));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteCoursesViaAPI(); 