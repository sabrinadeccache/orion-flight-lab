import type { Metadata } from 'next';
import './globals.css';
import { createSupabaseServerClient } from '../lib/supabase/server';
import { SupabaseProvider } from '../components/providers/supabase-provider';
import { SidebarNav } from '../components/nav/sidebar-nav';

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

  const roles = (session?.user?.app_metadata?.roles as string[] | undefined) ?? [];

  return (
    <html lang="pt-BR">
      <body>
        <SupabaseProvider initialSession={session}>
          {session ? (
            <div className="flex">
              <SidebarNav roles={roles} />
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          ) : (
            children
          )}
        </SupabaseProvider>
      </body>
    </html>
  );
}
