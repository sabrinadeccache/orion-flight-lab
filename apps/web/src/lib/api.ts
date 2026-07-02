import { createSupabaseServerClient } from './supabase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Minimal server-side fetch helper against the NestJS API, attaching the
 * current Supabase session's access token. Every response follows the
 * standardized `{ data, meta, errors }` shape (see apps/api).
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as { data: T };
    return body.data;
  } catch {
    // API unreachable (e.g. local dev without the backend running) — pages
    // fall back to an empty state rather than failing the render.
    return null;
  }
}
