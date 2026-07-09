import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // "Voo noturno" — tema escuro do portal do aluno (LMS), inspirado em
      // painel de instrumentos de cabine à noite. Usado só dentro de
      // /portal e /courses/[id]/preview; o resto do admin fica no tema
      // claro padrão do Tailwind.
      colors: {
        portal: {
          void: '#0B0F14',
          panel: '#131A22',
          panelHover: '#1B242F',
          amber: '#F5A623',
          cyan: '#3DDAD7',
          text: '#E8EDF2',
          muted: '#6B7785',
        },
      },
      fontFamily: {
        display: ['var(--font-portal-display)'],
        mono: ['var(--font-portal-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;
