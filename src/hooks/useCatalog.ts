import { useState, useEffect, useCallback } from 'react';
import { fetchCursosFromFirestore, fetchCursoBySlug, fetchRawCatalog } from '@/shared/lib/course-bridge';
import type { Curso } from '@/data/cursos';

/**
 * Hook to fetch the public course catalog from Firestore.
 * Automatically falls back to hardcoded data if the API is unavailable.
 */
export function useCatalog(institutionId?: string) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCursosFromFirestore(institutionId);
      setCursos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading catalog');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cursos, loading, error, refresh };
}

/**
 * Hook to fetch a single course by slug with its live cohort data.
 */
export function useCurso(slug: string, institutionId?: string) {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCursoBySlug(slug, institutionId);
        setCurso(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading course');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, institutionId]);

  return { curso, loading, error };
}

/**
 * Hook to access the raw API catalog for enrollment metadata.
 */
export function useRawCatalog(institutionId?: string) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRawCatalog(institutionId)
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false));
  }, [institutionId]);

  return { catalog, loading };
}
