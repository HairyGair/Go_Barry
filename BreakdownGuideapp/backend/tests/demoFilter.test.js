// Unit tests for the demo-isolation helpers. No DB or extra deps needed:
//   cd BreakdownGuideapp/backend && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_BADGE, isDemoUser, demoSqlFilter, isRowInDemoScope, demoBreakdownRefFilter,
  scopedSupervisorBadge, demoSelfOnlyParam, demoSelfOnlyBody, denyDemoWrite, bodyBreakdownRef,
  requireBreakdownInScope,
} from '../utils/demoFilter.js';

const demo = { id: 'demo-0000-0000-0000-000000000001', badge_number: DEMO_BADGE, role: 'admin' };
const real = { id: '22222222-2222-2222-2222-222222222222', badge_number: 'TS902', role: 'supervisor' };

function mockRes() {
  return {
    statusCode: 200, body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('isDemoUser keys on the DEMO01 badge only', () => {
  assert.equal(isDemoUser(demo), true);
  assert.equal(isDemoUser(real), false);
  assert.equal(isDemoUser(undefined), false);
  assert.equal(isDemoUser({ role: 'admin' }), false);
});

test('demoSqlFilter: demo sees only demo rows, everyone else excludes them', () => {
  assert.equal(demoSqlFilter(demo), " AND supervisor_badge = 'DEMO01'");
  assert.equal(demoSqlFilter(real), " AND supervisor_badge != 'DEMO01'");
  assert.equal(demoSqlFilter(real, { alias: 'b' }), " AND b.supervisor_badge != 'DEMO01'");
  assert.equal(demoSqlFilter(demo, { column: 'outgoing_supervisor_badge' }), " AND outgoing_supervisor_badge = 'DEMO01'");
  // non-whitelisted columns fall back to supervisor_badge (no SQL injection via column)
  assert.equal(demoSqlFilter(demo, { column: 'x; DROP TABLE y' }), " AND supervisor_badge = 'DEMO01'");
});

test('isRowInDemoScope separates the two worlds', () => {
  const demoRow = { supervisor_badge: 'DEMO01' };
  const realRow = { supervisor_badge: 'TS902' };
  assert.equal(isRowInDemoScope(demoRow, demo), true);
  assert.equal(isRowInDemoScope(realRow, demo), false);
  assert.equal(isRowInDemoScope(realRow, real), true);
  assert.equal(isRowInDemoScope(demoRow, real), false);
  assert.equal(isRowInDemoScope({ badge_number: 'DEMO01' }, demo, 'badge_number'), true);
});

test('demoBreakdownRefFilter scopes child tables through the parent breakdown', () => {
  assert.match(demoBreakdownRefFilter(demo), /^ AND breakdown_id IN \(SELECT breakdown_id FROM breakdowns WHERE supervisor_badge = 'DEMO01'/);
  assert.match(demoBreakdownRefFilter(real, { alias: 'e', key: 'id' }), /^ AND e\.breakdown_id NOT IN \(SELECT id FROM breakdowns/);
  assert.match(demoBreakdownRefFilter(real, { column: 'bad col' }), / AND breakdown_id NOT IN/);
});

test('scopedSupervisorBadge pins demo writes to DEMO01 and keeps real writes out of it', () => {
  assert.equal(scopedSupervisorBadge(demo, 'TS902'), DEMO_BADGE);
  assert.equal(scopedSupervisorBadge(demo, undefined), DEMO_BADGE);
  assert.equal(scopedSupervisorBadge(real, 'TA901'), 'TA901');
  assert.equal(scopedSupervisorBadge(real, DEMO_BADGE), 'TS902');
  assert.equal(scopedSupervisorBadge(real, undefined), 'TS902');
});

test('demoSelfOnlyParam: demo may only address itself; real users untouched', () => {
  const byId = demoSelfOnlyParam('id');
  let res = mockRes(); let called = false;
  byId({ user: demo }, res, () => { called = true; }, demo.id);
  assert.equal(called, true);
  res = mockRes(); called = false;
  byId({ user: demo }, res, () => { called = true; }, real.id);
  assert.equal(called, false); assert.equal(res.statusCode, 404);
  res = mockRes(); called = false;
  byId({ user: real }, res, () => { called = true; }, demo.id);
  assert.equal(called, true);
  const byBadge = demoSelfOnlyParam('badge');
  res = mockRes(); called = false;
  byBadge({ user: demo }, res, () => { called = true; }, 'TS902');
  assert.equal(called, false); assert.equal(res.statusCode, 404);
});

test('demoSelfOnlyBody rejects demo requests naming another supervisor', () => {
  let res = mockRes(); let called = false;
  demoSelfOnlyBody({ user: demo, body: { supervisorId: real.id } }, res, () => { called = true; });
  assert.equal(called, false); assert.equal(res.statusCode, 403);
  res = mockRes(); called = false;
  demoSelfOnlyBody({ user: demo, body: { supervisorId: demo.id, supervisorBadge: 'DEMO01' } }, res, () => { called = true; });
  assert.equal(called, true);
  res = mockRes(); called = false;
  demoSelfOnlyBody({ user: real, body: { supervisorId: 'someone-else' } }, res, () => { called = true; });
  assert.equal(called, true);
});

test('denyDemoWrite works as middleware and as an inline guard', () => {
  let res = mockRes(); let called = false;
  denyDemoWrite({ user: demo }, res, () => { called = true; });
  assert.equal(called, false); assert.equal(res.statusCode, 403);
  res = mockRes();
  assert.equal(denyDemoWrite({ user: demo }, res), true);
  res = mockRes();
  assert.equal(denyDemoWrite({ user: real }, res), false);
});

test('bodyBreakdownRef reads breakdown_id or breakdownId', () => {
  assert.equal(bodyBreakdownRef({ body: { breakdown_id: 'BD-1' } }), 'BD-1');
  assert.equal(bodyBreakdownRef({ body: { breakdownId: 7 } }), 7);
  assert.equal(bodyBreakdownRef({ body: {} }), undefined);
  assert.equal(bodyBreakdownRef({}), undefined);
});

test('requireBreakdownInScope passes through when there is no reference (no DB hit)', async () => {
  const mw = requireBreakdownInScope(bodyBreakdownRef);
  let called = false;
  await mw({ user: demo, body: {} }, mockRes(), () => { called = true; });
  assert.equal(called, true);
});
