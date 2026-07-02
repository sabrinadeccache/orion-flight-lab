import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orion Flight Lab',
  description: 'Sistema de gestão de CTAC certificado ANAC (RBAC 142 / IS 142-001).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
