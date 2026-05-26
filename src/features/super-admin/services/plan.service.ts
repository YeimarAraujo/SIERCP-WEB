import {
    doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    collection, serverTimestamp, onSnapshot,
    query, where, Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { DEFAULT_PLANS, type Plan } from '@/shared/types/plan';
import {
    corporatePlans, sstConLicenciaPlans, sstSinLicenciaPlans, maniquiPackages,
} from '@/data/planes';

// ── Pricing Plans (public website / pricing page) ─────────────────────────────

export type PricingCategory = 'corporativo' | 'manikin' | 'sst-con' | 'sst-sin';

export interface PricingDoc {
    id: string;
    category: PricingCategory;
    active: boolean;
    deletedAt: Timestamp | null;
    displayOrder: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    // Plan fields (corporativo / sst-con / sst-sin)
    slug: string;
    name: string;
    desc: string;
    monthlyCOP: number;
    annualCOP?: number;          // Exact annual price entered by SA — avoids round-trip drift
    highlight: boolean;
    badge: string | null;
    isContact?: boolean;
    isOneTime?: boolean;
    maniquiesIncluidos?: number;
    annualDiscountPercent?: number;
    features?: { text: string; included: boolean }[];
    // ManiquiPackage fields (category === 'manikin')
    quantity?: number | null;
    unitPriceCOP?: number;
    totalPriceCOP?: number | null;
    discountPercent?: number;
    includes?: string[];
}

const COL = 'pricing_plans';

export const PricingPlanService = {
    subscribe(
        callback: (docs: PricingDoc[]) => void,
        onError?: (e: Error) => void,
    ): Unsubscribe {
        if (!db) { callback([]); return () => {}; }
        const q = query(
            collection(db, COL),
            where('deletedAt', '==', null),
        );
        return onSnapshot(
            q,
            snap => {
                // De-duplicate by category+slug: prefer deterministic IDs, then first seen
                const seen = new Map<string, PricingDoc>();
                for (const d of snap.docs) {
                    const data = { id: d.id, ...d.data() } as PricingDoc;
                    const key = `${data.category}-${data.slug}`;
                    const existing = seen.get(key);
                    const isCanonical = d.id === key;
                    if (!existing || isCanonical) seen.set(key, data);
                }
                const docs = [...seen.values()]
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                callback(docs);
            },
            err => onError?.(err as Error),
        );
    },

    async create(data: Omit<PricingDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        if (!db) throw new Error('Firebase no configurado');
        const ref = await addDoc(collection(db, COL), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    /** Create with a deterministic ID (`category-slug`). */
    async createWithId(id: string, data: Omit<PricingDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        if (!db) throw new Error('Firebase no configurado');
        await setDoc(doc(db, COL, id), {
            ...data,
            id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return id;
    },

    async update(id: string, data: Partial<Omit<PricingDoc, 'id' | 'createdAt'>>): Promise<void> {
        if (!db) throw new Error('Firebase no configurado');
        if (!id) throw new Error('ID de documento requerido');
        await setDoc(doc(db, COL, id), {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    async toggle(id: string, active: boolean): Promise<void> {
        if (!db) throw new Error('Firebase no configurado');
        await updateDoc(doc(db, COL, id), {
            active,
            updatedAt: serverTimestamp(),
        });
    },

    async softDelete(id: string): Promise<void> {
        if (!db) throw new Error('Firebase no configurado');
        await updateDoc(doc(db, COL, id), {
            deletedAt: serverTimestamp(),
            active: false,
            updatedAt: serverTimestamp(),
        });
    },

    async restore(id: string): Promise<void> {
        if (!db) throw new Error('Firebase no configurado');
        await updateDoc(doc(db, COL, id), {
            deletedAt: null,
            active: true,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Seeds pricing_plans from static data using deterministic doc IDs.
     * Idempotent — safe to call multiple times (React StrictMode, etc.).
     */
    async seed(): Promise<boolean> {
        if (!db) return false;

        let seeded = false;
        let order = 0;

        const push = async (item: { slug: string } & object, category: PricingCategory) => {
            const id = `${category}-${item.slug}`;
            const ref = doc(db!, COL, id);
            const existing = await getDoc(ref);
            if (existing.exists()) { order++; return; }
            await setDoc(ref, {
                ...item,
                id,
                category,
                active: true,
                deletedAt: null,
                displayOrder: order++,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            seeded = true;
        };

        for (const p of corporatePlans) await push(p, 'corporativo');
        for (const m of maniquiPackages) await push(m, 'manikin');
        for (const p of sstConLicenciaPlans) await push(p, 'sst-con');
        for (const p of sstSinLicenciaPlans) await push(p, 'sst-sin');
        return seeded;
    },

    /**
     * Removes documents whose Firestore ID doesn't match the expected
     * deterministic pattern `${category}-${slug}`. Use once to clean up
     * duplicates created by the previous addDoc-based seed.
     */
    async purgeDuplicates(): Promise<number> {
        if (!db) return 0;
        const snap = await getDocs(collection(db, COL));
        let removed = 0;
        for (const d of snap.docs) {
            const data = d.data() as PricingDoc;
            const expected = `${data.category}-${data.slug}`;
            if (data.category && data.slug && d.id !== expected) {
                await deleteDoc(d.ref);
                removed++;
            }
        }
        return removed;
    },
};

// ── Institution Plans (Firestore — backend quotas) ────────────────────────────

export const PlanService = {
    /** Load plans from Firestore; fallback to DEFAULT_PLANS if collection is empty */
    getAll: async (): Promise<Plan[]> => {
        if (!db) return DEFAULT_PLANS.map((p) => ({ ...p, id: p.slug }));
        try {
            const snap = await getDocs(collection(db, 'plans'));
            if (!snap.empty) {
                return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plan));
            }
        } catch {
            // fallback
        }
        return DEFAULT_PLANS.map((p) => ({ ...p, id: p.slug }));
    },

    /** Persist a plan update to Firestore (creates doc if it doesn't exist) */
    update: async (slug: string, data: Partial<Omit<Plan, 'id' | 'createdAt'>>): Promise<void> => {
        if (!db) throw new Error('Firebase no configurado');
        await setDoc(
            doc(db, 'plans', slug),
            { ...data, updatedAt: serverTimestamp() },
            { merge: true },
        );
    },

    /** Seed Firestore with DEFAULT_PLANS (one-time setup, won't overwrite existing) */
    seed: async (): Promise<void> => {
        if (!db) return;
        const snap = await getDocs(collection(db, 'plans'));
        if (!snap.empty) return;
        for (const plan of DEFAULT_PLANS) {
            await setDoc(doc(db, 'plans', plan.slug), {
                ...plan,
                id: plan.slug,
                createdAt: serverTimestamp(),
            });
        }
    },
};
