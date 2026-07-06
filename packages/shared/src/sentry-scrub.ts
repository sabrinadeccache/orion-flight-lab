/**
 * Field names that must never leave the country inside a Sentry event —
 * request bodies/query strings, extra context, and breadcrumb data are all
 * walked recursively and any matching key gets its value replaced.
 * Keep this in sync with personal/sensitive fields across the Prisma schema
 * (Student.cpf, Client.cnpj_cpf, SafetyOccurrence details, etc).
 */
const SENSITIVE_KEYS = [
  'cpf',
  'cnpj',
  'cnpj_cpf',
  'full_name',
  'name',
  'email',
  'phone',
  'birth_date',
  'anac_record_number',
  'address',
  'authorization',
  'access_token',
  'password',
];

const REDACTED = '[Filtered]';

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

/** Query strings arrive as a raw "key=value&key=value" string, not an object. */
function scrubQueryString(value: string): string {
  const params = new URLSearchParams(value);
  for (const key of [...params.keys()]) {
    if (isSensitiveKey(key)) {
      params.set(key, REDACTED);
    }
  }
  return params.toString();
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 6 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED : scrubValue(nested, depth + 1);
    }
    return result;
  }

  return value;
}

/**
 * beforeSend/beforeSendTransaction hook: strips known PII fields from a
 * Sentry event's request data, extra context, and breadcrumbs before it's
 * sent to Sentry's servers (used to keep student/instructor/client personal
 * data from crossing an international transfer under LGPD art. 33).
 */
export function scrubSentryEvent<T>(event: T): T {
  const scrubbed = { ...event } as Record<string, unknown>;

  const request = scrubbed.request as Record<string, unknown> | undefined;
  if (request) {
    scrubbed.request = {
      ...request,
      data: scrubValue(request.data, 0),
      query_string:
        typeof request.query_string === 'string'
          ? scrubQueryString(request.query_string)
          : scrubValue(request.query_string, 0),
      cookies: request.cookies ? REDACTED : request.cookies,
      headers: scrubValue(request.headers, 0),
    };
  }

  if (scrubbed.extra) {
    scrubbed.extra = scrubValue(scrubbed.extra, 0);
  }

  if (Array.isArray(scrubbed.breadcrumbs)) {
    scrubbed.breadcrumbs = (scrubbed.breadcrumbs as Record<string, unknown>[]).map((crumb) => ({
      ...crumb,
      data: scrubValue(crumb.data, 0),
    }));
  }

  return scrubbed as T;
}
