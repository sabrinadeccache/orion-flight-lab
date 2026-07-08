// Guards against the "Cannot find the middleware module" dev error (see CLAUDE.md §14):
// after repeated `next dev` restarts (especially hard-killed ones), .next/server/middleware-manifest.json
// can end up with an empty "middleware": {} even though src/middleware.ts exists. When that mismatch is
// detected, wipe .next so the next `next dev` rebuilds a consistent cache — otherwise leave the cache alone
// so incremental dev builds stay fast.
const fs = require('fs');
const path = require('path');

const webRoot = path.join(__dirname, '..');
const nextDir = path.join(webRoot, '.next');
const manifestPath = path.join(nextDir, 'server', 'middleware-manifest.json');
const middlewareSourceExists = fs.existsSync(path.join(webRoot, 'src', 'middleware.ts'));

function wipeNextDir(reason) {
  console.log(`[check-next-cache] ${reason} — clearing .next before starting dev server`);
  fs.rmSync(nextDir, { recursive: true, force: true });
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

if (!fs.existsSync(manifestPath)) {
  process.exit(0);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const hasMiddlewareEntry = manifest.middleware && Object.keys(manifest.middleware).length > 0;

  if (middlewareSourceExists && !hasMiddlewareEntry) {
    wipeNextDir('stale middleware-manifest.json (empty middleware entry but src/middleware.ts exists)');
  }
} catch (err) {
  wipeNextDir(`unreadable/corrupted middleware-manifest.json (${err.message})`);
}
