/**
 * Cliente de /api/people. Las reglas no dejan leer perfiles de otras
 * instituciones: las búsquedas por cédula o correo y los perfiles de alumnos
 * de cursos independientes se piden al servidor, que valida la relación.
 */
import { getAuth } from 'firebase/auth';

export interface PersonCard {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    identification?: string | null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('No autenticado');
    const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
    return data as T;
}

export const PeopleClient = {
    async lookup(query: { identification?: string; email?: string }): Promise<PersonCard | null> {
        const data = await call<{ person: PersonCard | null }>({ action: 'lookup', ...query });
        return data.person;
    },

    async get(ids: string[]): Promise<PersonCard[]> {
        if (ids.length === 0) return [];
        const data = await call<{ people: PersonCard[] }>({ action: 'batch', ids });
        return data.people;
    },
};
