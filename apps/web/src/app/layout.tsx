import type { Metadata } from 'next';
import './globals.css';
import { createSupabaseServerClient } from '../lib/supabase/server';
import { SupabaseProvider } from '../components/providers/supabase-provider';

export const metadata: Metadata = {
  title: 'Orion Flight Lab',
  description: 'Sistema de gestão de CTAC certificado ANAC (RBAC 142 / IS 142-001).',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="pt-BR">
      <body>
        <SupabaseProvider initialSession={session}>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
