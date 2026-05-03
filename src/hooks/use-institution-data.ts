'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { UserService } from '@/services/firestore.service';
import type { UserModel } from '@/models/user';

export interface InstitutionData {
    students: UserModel[];
    instructors: UserModel[];
    totalSessions: number;
    activeSessions: number;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useInstitutionData(): InstitutionData {
    const user = useAuthStore((state) => state.user);
    const [students, setStudents] = useState<UserModel[]>([]);
    const [instructors, setInstructors] = useState<UserModel[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [activeSessions, setActiveSessions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.institutionId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [studentsData, instructorsData] = await Promise.all([
                UserService.getStudentsByInstitution(user.institutionId),
                UserService.getInstructorsByInstitution(user.institutionId),
            ]);

            setStudents(studentsData);
            setInstructors(instructorsData);
            setTotalSessions(0);
            setActiveSessions(0);
        } catch (e) {
            setError('Error al cargar los datos de la institución');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.institutionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        students,
        instructors,
        totalSessions,
        activeSessions,
        loading,
        error,
        refetch: fetchData,
    };
}