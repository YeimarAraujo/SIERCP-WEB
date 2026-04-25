'use client';

import { create } from 'zustand';
import type { SessionModel } from '@/models/session';

interface SessionStore {
    sessions: SessionModel[];
    activeSession: SessionModel | null;
    loading: boolean;

    setSessions: (sessions: SessionModel[]) => void;
    setActiveSession: (session: SessionModel | null) => void;
    upsertSession: (session: SessionModel) => void;
    setLoading: (v: boolean) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
    sessions: [],
    activeSession: null,
    loading: false,

    setSessions: (sessions) => set({ sessions }),

    setActiveSession: (session) => set({ activeSession: session }),

    upsertSession: (session) => {
        const existing = get().sessions.findIndex((s) => s.id === session.id);
        if (existing >= 0) {
            const updated = [...get().sessions];
            updated[existing] = session;
            set({ sessions: updated });
        } else {
            set({ sessions: [session, ...get().sessions] });
        }
        if (get().activeSession?.id === session.id) {
            set({ activeSession: session });
        }
    },

    setLoading: (v) => set({ loading: v }),
}));