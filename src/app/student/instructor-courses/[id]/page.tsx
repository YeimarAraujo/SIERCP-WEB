'use client';

import { useParams } from 'next/navigation';
import { CourseManagementView } from '@/components/course/course-management-view';

export default function StudentInstructorCoursePage() {
    const { id } = useParams() as { id: string };
    return (
        <CourseManagementView
            courseId={id}
            basePath="/student/instructor-courses"
            monitorHref="/student/live"
        />
    );
}
