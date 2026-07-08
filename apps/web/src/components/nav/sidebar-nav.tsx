'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '../providers/supabase-provider';

interface NavItem {
  href: string;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Alunos' },
  { href: '/personnel', label: 'Pessoal' },
  { href: '/qualifications', label: 'Qualificações' },
  { href: '/courses', label: 'Cursos' },
  { href: '/certificates', label: 'Certificados' },
  { href: '/documents', label: 'Documentos' },
  { href: '/clients', label: 'Clientes', roles: ['ADMIN', 'COMERCIAL'] },
  { href: '/crm/accounts', label: 'CRM', roles: ['ADMIN', 'COMERCIAL'] },
  { href: '/contracts', label: 'Contratos', roles: ['ADMIN', 'FINANCEIRO', 'COMERCIAL'] },
  { href: '/financial/charges', label: 'Financeiro', roles: ['ADMIN', 'FINANCEIRO'] },
  { href: '/sgq/audit-programs', label: 'SGQ', roles: ['ADMIN', 'GERENTE_QUALIDADE'] },
  { href: '/sgso/hazards', label: 'SGSO', roles: ['ADMIN', 'GERENTE_SEGURANCA'] },
  { href: '/reports', label: 'Relatórios', roles: ['ADMIN', 'GERENTE_QUALIDADE', 'GERENTE_SEGURANCA'] },
];

const QUICK_ACTIONS: NavItem[] = [
  { href: '/enrollments/new', label: '+ Nova matrícula' },
  { href: '/exams/new', label: '+ Novo exame' },
];

function isVisible(item: NavItem, roles: string[]): boolean {
  return !item.roles || item.roles.some((role) => roles.includes(role));
}

export function SidebarNav({ roles }: { roles: string[] }): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabase();

  async function handleLogout(): Promise<void> {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white p-4">
      <Link href="/dashboard" className="mb-6 block text-lg font-semibold text-slate-900">
        Orion Flight Lab
      </Link>

      <ul className="flex-1 space-y-1">
        {NAV_ITEMS.filter((item) => isVisible(item, roles)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-1 border-t border-slate-200 pt-4">
        {QUICK_ACTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Sair
      </button>
    </nav>
  );
}
