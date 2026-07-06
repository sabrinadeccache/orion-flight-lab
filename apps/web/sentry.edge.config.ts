import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
const isPlaceholderDsn = !dsn || dsn.includes('examplePublicKey');

if (!isPlaceholderDsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
