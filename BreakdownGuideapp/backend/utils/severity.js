// Breakdown severity is a fixed vocabulary. Client input can be malformed
// (e.g. an object), which previously got persisted/rendered as "[object Object]".
// Use this to normalise severity at every write and read boundary.

export const VALID_SEVERITIES = ['STOP', 'AMBER', 'CONTINUE'];

// Returns a known severity. Falls back to the wizard decision, then `fallback`.
// Use fallback 'AMBER' on write (a safe default for a new breakdown) and
// 'UNKNOWN' on read (so displays never show garbage).
export function resolveSeverity(value, decision, fallback = 'UNKNOWN') {
  const v = typeof value === 'string' ? value.toUpperCase() : '';
  if (VALID_SEVERITIES.includes(v)) return v;
  const d = typeof decision === 'string' ? decision.toUpperCase() : '';
  if (VALID_SEVERITIES.includes(d)) return d;
  return fallback;
}
