import { Sora, IBM_Plex_Mono } from 'next/font/google';

const displayFont = Sora({ subsets: ['latin'], variable: '--font-portal-display', weight: ['600', '700'] });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-portal-mono', weight: ['400', '500'] });

/**
 * "Voo noturno" — tema escuro do portal do aluno, isolado deste layout pra
 * baixo. O resto do app (admin) continua no tema claro padrão; nada aqui
 * vaza pra fora de /portal.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className={`${displayFont.variable} ${monoFont.variable} min-h-screen w-full bg-portal-void font-sans text-portal-text`}
    >
      {children}
    </div>
  );
}
