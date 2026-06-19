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
  const allowed = new Set(['supervisor_badge', 'actor_id', 'badge_number']);
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

export default {
  DEMO_BADGE, DEMO_SUPERVISOR_ID, DEMO_ENGINEER_PREFIX,
  isDemoUser, demoSqlFilter, applyDemoFilter, applyEngineerDemoFilter,
};
