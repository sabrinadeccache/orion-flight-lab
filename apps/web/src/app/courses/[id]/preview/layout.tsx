import { Sora, IBM_Plex_Mono } from 'next/font/google';

const displayFont = Sora({ subsets: ['latin'], variable: '--font-portal-display', weight: ['600', '700'] });
const monoFont = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-portal-mono', weight: ['400', '500'] });

/** Same "voo noturno" theme as /portal, reused here so the admin's preview
 * looks exactly like the student's real experience. */
export default function CoursePreviewLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      className={`${displayFont.variable} ${monoFont.variable} min-h-screen w-full bg-portal-void font-sans text-portal-text`}
    >
      {children}
    </div>
  );
}
