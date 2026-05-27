import {
    collection, getDocs, onSnapshot,
    query, where,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import type { Curso } from '@/data/cursos';

const COL = 'jomarCourses';

export interface JomarGrupo {
    id: string;
    horario: 'mañana' | 'tarde';
    horarioLabel: string;
    inscripcionInicio: string;
    inscripcionFin: string;
    inicioClases: string;
    maxEstudiantes: number;
    inscritos: number;
    estado: 'proximo' | 'abierto' | 'agotado' | 'en_curso' | 'finalizado';
}

export interface JomarCourseDoc {
    id: string;
    slug: string;
    nombre: string;
    descripcion: string;
    descripcionLarga: string;
    nivel: 'basico' | 'intermedio' | 'avanzado';
    modalidad: 'presencial' | 'virtual' | 'hibrida';
    duracion: string;
    sesiones: number;
    precioCOP: number;
    precioUSD: number;
    objetivos: string[];
    requisitos: string[];
    incluyeCertificado: boolean;
    normativa: string[];
    tags: string[];
    icono: string;
    paraQuien: string;
    grupos: JomarGrupo[];
    modulos: { nombre: string; temas: string[]; duracion: string }[];
    isPublished: boolean;
}

function docToCurso(data: JomarCourseDoc): Curso {
    return {
        slug: data.slug,
        nombre: data.nombre,
        descripcion: data.descripcion,
        descripcionLarga: data.descripcionLarga,
        nivel: data.nivel,
        modalidad: data.modalidad,
        duracion: data.duracion,
        sesiones: data.sesiones,
        precioCOP: data.precioCOP,
        precioUSD: data.precioUSD,
        objetivos: data.objetivos ?? [],
        requisitos: data.requisitos ?? [],
        incluyeCertificado: data.incluyeCertificado,
        normativa: data.normativa ?? [],
        tags: data.tags ?? [],
        icono: data.icono,
        paraQuien: data.paraQuien,
        modulos: data.modulos ?? [],
        grupos: (data.grupos ?? []).map(g => ({
            ...g,
            inscripcionInicio: new Date(g.inscripcionInicio),
            inscripcionFin: new Date(g.inscripcionFin),
            inicioClases: new Date(g.inicioClases),
        })),
    };
}

export const JomarCourseService = {
    /** Realtime subscription — published courses only (for public pages) */
    subscribePublic(
        callback: (cursos: Curso[]) => void,
        onError?: (e: Error) => void,
    ): Unsubscribe {
        if (!db) { callback([]); return () => {}; }
        const q = query(collection(db, COL), where('isPublished', '==', true));
        return onSnapshot(
            q,
            snap => callback(snap.docs.map(d => docToCurso({ id: d.id, ...d.data() } as JomarCourseDoc))),
            err => onError?.(err as Error),
        );
    },

    /** Realtime subscription — all courses (for admin) */
    subscribeAll(
        callback: (docs: JomarCourseDoc[]) => void,
        onError?: (e: Error) => void,
    ): Unsubscribe {
        if (!db) { callback([]); return () => {}; }
        return onSnapshot(
            collection(db, COL),
            snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as JomarCourseDoc))),
            err => onError?.(err as Error),
        );
    },

    /** One-shot fetch by slug — published only */
    async getBySlug(slug: string): Promise<Curso | null> {
        if (!db) return null;
        const q = query(
            collection(db, COL),
            where('slug', '==', slug),
            where('isPublished', '==', true),
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return docToCurso({ id: snap.docs[0].id, ...snap.docs[0].data() } as JomarCourseDoc);
    },
};
