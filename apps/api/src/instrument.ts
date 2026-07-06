import * as Sentry from '@sentry/nestjs';
import { scrubSentryEvent } from '@orion/shared';

/**
 * Must be imported before any other module (see main.ts) so Sentry's
 * auto-instrumentation can hook http/express before they're required.
 * A missing or placeholder DSN disables the SDK instead of erroring.
 */
const dsn = process.env.SENTRY_DSN;
const isPlaceholderDsn = !dsn || dsn.includes('examplePublicKey');

if (!isPlaceholderDsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Student/instructor/client PII (CPF, names, contacts) must not cross the
    // border to Sentry's EU/US region under LGPD art. 33 — only technical
    // metadata (stack trace, route, status) should ever be sent.
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,
  });
}
