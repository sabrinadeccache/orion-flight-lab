'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}): React.ReactElement {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session] = useState<Session | null>(initialSession);

  const value = useMemo(() => ({ supabase, session }), [supabase, session]);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseContextValue {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
