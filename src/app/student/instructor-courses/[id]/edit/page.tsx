'use client';

import { useParams } from 'next/navigation';
import { CourseEditView } from '@/components/course/course-edit-view';

export default function StudentInstructorCourseEditPage() {
    const { id } = useParams() as { id: string };
    return <CourseEditView courseId={id} basePath="/student/instructor-courses" />;
}
