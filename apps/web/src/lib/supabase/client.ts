import { createBrowserClient } from '@supabase/ssr';

/** Browser-side Supabase client. Login/logout always happen through this. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
