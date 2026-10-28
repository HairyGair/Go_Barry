/**
 * Demo data isolation helpers.
 *
 * The demo account (badge DEMO01) shares the production database, so every query
 * that reads operational data must keep the two worlds apart:
 *   - Demo sessions see ONLY demo rows.
 *   - Everyone else sees everything EXCEPT demo rows.
 *
 * Use demoSqlFilter() for raw SQL (returns a fragment that begins with " AND "),
 * and isDemoUser() + .eq()/.neq() for query-builder chains.
 */

export const DEMO_BADGE = 'DEMO01';
// UUID of the demo supervisor row (see migration 033). Demo engineers are tagged
// with managed_by = this id so they can be isolated from real staff.
export const DEMO_SUPERVISOR_ID = 'demo-0000-0000-0000-000000000001';

export function isDemoUser(user) {
  return user?.badge_number === DEMO_BADGE;
}

/**
 * SQL fragment that isolates demo data. Always begins with " AND " so it can be
 * appended to an existing WHERE clause (add "WHERE 1=1" first if there isn't one).
 *
 * @param {object} user - req.user
 * @param {object} [opts]
 * @param {string} [opts.alias] - table alias prefix, e.g. 'b' -> b.supervisor_badge
 * @param {string} [opts.column] - whitelisted column to match on (supervisor_badge | actor_id)
 */
export function demoSqlFilter(user, { alias = '', column = 'supervisor_badge' } = {}) {
  const allowed = new Set(['supervisor_badge', 'actor_id', 'badge_number', 'outgoing_supervisor_badge']);
  const col = allowed.has(column) ? column : 'supervisor_badge';
  const ref = alias ? `${alias}.${col}` : col;
  return isDemoUser(user)
    ? ` AND ${ref} = '${DEMO_BADGE}'`
    : ` AND ${ref} != '${DEMO_BADGE}'`;
}

/**
 * Apply demo isolation to a query-builder chain (from()...). Demo users get
 * .eq(column, 'DEMO01'); everyone else gets .neq(column, 'DEMO01').
 * Returns the builder so it can continue to be chained.
 */
export function applyDemoFilter(builder, user, column = 'supervisor_badge') {
  return isDemoUser(user)
    ? builder.eq(column, DEMO_BADGE)
    : builder.neq(column, DEMO_BADGE);
}

/**
 * Demo prefix for engineer badge numbers (e.g. DEMO-E01). Demo engineers all
 * carry this prefix, so we isolate them on badge_number (never NULL) rather than
 * managed_by (which can be NULL for real engineers and would be dropped by !=).
 */
export const DEMO_ENGINEER_PREFIX = 'DEMO-%';

/**
 * Apply demo isolation to an engineers query-builder chain. Demo sessions see
 * only demo engineers (badge LIKE 'DEMO-%'); everyone else excludes them.
 */
export function applyEngineerDemoFilter(builder, user) {
  return isDemoUser(user)
    ? builder.like('badge_number', DEMO_ENGINEER_PREFIX)
    : builder.notLike('badge_number', DEMO_ENGINEER_PREFIX);
}

/**
 * Express middleware / inline guard for endpoints that write to SHARED, real
 * (non-demo-scoped) data - e.g. the real fleet master table, GTFS import,
 * global system settings, or another supervisor's account. The demo account
 * shares production tables for these, so a demo session must never be able to
 * mutate them (only its own demo-tagged rows).
 *
 * Use as router-level middleware (`router.use(denyDemoWrite)` on an
 * admin-only sub-router) or call directly at the top of a handler:
 *   if (denyDemoWrite(req, res)) return;
 */
export function denyDemoWrite(req, res, next) {
  if (isDemoUser(req.user)) {
    const body = { success: false, error: 'Not available in demo' };
    if (typeof next === 'function') {
      return res.status(403).json(body);
    }
    res.status(403).json(body);
    return true;
  }
  if (typeof next === 'function') return next();
  return false;
}

/**
 * True when a row belongs to the same "world" as the user: demo sessions may only
 * touch DEMO01 rows, everyone else may only touch non-demo rows.
 */
export function isRowInDemoScope(row, user, column = 'supervisor_badge') {
  return isDemoUser(user) === (row?.[column] === DEMO_BADGE);
}

/**
 * SQL fragment (begins with " AND ") for child tables that reference a breakdown
 * (breakdown_events, replacement_vehicles, breakdown_lost_trips, ...). Scopes them
 * through the parent breakdown's supervisor_badge, so it works even when the child
 * row has no badge of its own (and never drops rows on NULL like `!=` would).
 *
 * @param {object} user - req.user
 * @param {object} [opts]
 * @param {string} [opts.alias] - child table alias
 * @param {string} [opts.column] - child column holding the breakdown reference
 * @param {'id'|'breakdown_id'} [opts.key] - which breakdowns column it references
 */
export function demoBreakdownRefFilter(user, { alias = '', column = 'breakdown_id', key = 'breakdown_id' } = {}) {
  const safeCol = /^[a-z_]+$/.test(column) ? column : 'breakdown_id';
  const safeKey = key === 'id' ? 'id' : 'breakdown_id';
  const ref = alias && /^[a-z_]+$/.test(alias) ? `${alias}.${safeCol}` : safeCol;
  const sub = `SELECT ${safeKey} FROM breakdowns WHERE supervisor_badge = '${DEMO_BADGE}' AND ${safeKey} IS NOT NULL`;
  return isDemoUser(user) ? ` AND ${ref} IN (${sub})` : ` AND ${ref} NOT IN (${sub})`;
}

/**
 * The supervisor_badge to store on a row a user creates. Demo sessions are pinned
 * to DEMO01 (so a demo can never inject rows into the real dataset under a real
 * badge), and real sessions can never write DEMO01 (which would hide the row).
 */
export function scopedSupervisorBadge(user, requested) {
  if (isDemoUser(user)) return DEMO_BADGE;
  if (!requested || requested === DEMO_BADGE) return user?.badge_number || null;
  return requested;
}

/**
 * Express middleware factory: rejects requests that reference a breakdown outside
 * the caller's world (a demo session touching a real breakdown, or vice versa).
 * Responds 404 so it does not confirm the breakdown exists.
 *
 * `getRef(req)` returns the breakdown reference: numeric breakdowns.id or the
 * string breakdown_id (BD-YYYY-NNNNN). When it returns nothing, or the breakdown
 * does not exist, the request passes through and the handler decides (usually 404).
 *
 * Use as route middleware, or via router.param('id', breakdownScopeParam).
 */
export function requireBreakdownInScope(getRef) {
  return async (req, res, next) => {
    const ref = getRef(req);
    if (ref === undefined || ref === null || ref === '') return next();
    try {
      // Imported lazily so the pure helpers above stay usable without a DB pool.
      const { query } = await import('../config/mysql.js');
      const refStr = String(ref);
      const rows = /^\d+$/.test(refStr)
        ? await query('SELECT supervisor_badge FROM breakdowns WHERE id = ? OR breakdown_id = ? LIMIT 1', [refStr, refStr])
        : await query('SELECT supervisor_badge FROM breakdowns WHERE breakdown_id = ? LIMIT 1', [refStr]);
      const row = rows?.[0];
      if (row && !isRowInDemoScope(row, req.user)) {
        return res.status(404).json({ success: false, error: 'Breakdown not found' });
      }
      return next();
    } catch (error) {
      // Fail closed: if we cannot prove the breakdown is in scope, refuse.
      console.error('Breakdown scope check failed:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to verify breakdown access' });
    }
  };
}

/** router.param() adapter: router.param('id', breakdownScopeParam) */
export function breakdownScopeParam(req, res, next, value) {
  return requireBreakdownInScope(() => value)(req, res, next);
}

/**
 * Demo sessions may only act as themselves on per-supervisor routes (breaks,
 * extensions): any supervisorId / supervisorBadge they send must be their own.
 * Real sessions are unaffected.
 *
 *   router.param('supervisorId', demoSelfOnlyParam('id'));
 *   router.param('supervisorBadge', demoSelfOnlyParam('badge'));
 *   router.use(demoSelfOnlyBody);
 */
export function demoSelfOnlyParam(kind) {
  return (req, res, next, value) => {
    if (!isDemoUser(req.user)) return next();
    const own = kind === 'badge' ? DEMO_BADGE : req.user.id;
    if (value !== own) return res.status(404).json({ success: false, error: 'Not found' });
    return next();
  };
}

export function demoSelfOnlyBody(req, res, next) {
  if (!isDemoUser(req.user)) return next();
  const { supervisorId, supervisorBadge } = req.body || {};
  if ((supervisorId && supervisorId !== req.user.id) || (supervisorBadge && supervisorBadge !== DEMO_BADGE)) {
    return res.status(403).json({ success: false, error: 'Not available in demo' });
  }
  return next();
}

/** Breakdown reference from a JSON body (breakdown_id or breakdownId). */
export const bodyBreakdownRef = (req) =>
  req.body?.breakdown_id ?? req.body?.breakdownId ?? undefined;

export default {
  DEMO_BADGE, DEMO_SUPERVISOR_ID, DEMO_ENGINEER_PREFIX,
  isDemoUser, demoSqlFilter, applyDemoFilter, applyEngineerDemoFilter, denyDemoWrite,
  isRowInDemoScope, demoBreakdownRefFilter, scopedSupervisorBadge,
  requireBreakdownInScope, breakdownScopeParam, bodyBreakdownRef,
  demoSelfOnlyParam, demoSelfOnlyBody,
};
