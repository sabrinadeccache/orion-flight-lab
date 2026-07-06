const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Linting is centralized at the monorepo root (npm run lint), which knows
  // how to resolve the workspace-relative ESLint `project` paths. Next's own
  // build-time lint step runs with apps/web as cwd and cannot resolve those
  // paths, so it is disabled here to avoid a duplicate, misconfigured pass.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Required in Next.js 14 for src/instrumentation.ts (Sentry's server/edge init hook)
  // to actually run — stable without this flag only from Next.js 15 onward.
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  // No SENTRY_AUTH_TOKEN configured yet — skip the source map upload step
  // instead of letting the plugin warn on every build.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
