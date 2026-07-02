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
};

module.exports = nextConfig;
