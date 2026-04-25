'use client';

import { create } from 'zustand';
import type { CourseModel } from '@/models/course';

interface CourseStore {
    courses: CourseModel[];
    activeCourse: CourseModel | null;
    loading: boolean;

    setCourses: (courses: CourseModel[]) => void;
    setActiveCourse: (course: CourseModel | null) => void;
    upsertCourse: (course: CourseModel) => void;
    setLoading: (v: boolean) => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
    courses: [],
    activeCourse: null,
    loading: false,

    setCourses: (courses) => set({ courses }),

    setActiveCourse: (course) => set({ activeCourse: course }),

    upsertCourse: (course) => {
        const idx = get().courses.findIndex((c) => c.id === course.id);
        if (idx >= 0) {
            const updated = [...get().courses];
            updated[idx] = course;
            set({ courses: updated });
        } else {
            set({ courses: [course, ...get().courses] });
        }
    },

    setLoading: (v) => set({ loading: v }),
}));