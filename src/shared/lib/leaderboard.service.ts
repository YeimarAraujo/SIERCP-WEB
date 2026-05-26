import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { LeaderboardEntry } from '@/shared/types/leaderboard';

export const LeaderboardService = {
    async getForInstitution(
        institutionId: string,
        maxEntries = 100
    ): Promise<LeaderboardEntry[]> {
        const q = query(
            collection(db, 'leaderboards', institutionId, 'students'),
            orderBy('averageScore', 'desc'),
            limit(maxEntries)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => {
            const data = d.data();
            return {
                uid: data.uid as string,
                displayName: (data.displayName as string) || 'Usuario',
                averageScore: (data.averageScore as number) ?? 0,
                totalSessions: (data.totalSessions as number) ?? 0,
                trend: (data.trend as 'up' | 'down' | 'minus') ?? 'minus',
                updatedAt:
                    data.updatedAt instanceof Timestamp
                        ? data.updatedAt.toDate()
                        : new Date(),
            };
        });
    },
};
