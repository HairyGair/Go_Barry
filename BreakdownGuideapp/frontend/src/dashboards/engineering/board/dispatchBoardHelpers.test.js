import { describe, it, expect } from 'vitest';
import { getShiftWindow, deriveEngineerLiveStatus } from './dispatchBoardHelpers';

const at = (h, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

describe('getShiftWindow', () => {
  const day = { shift_start: '08:00:00', shift_end: '17:00:00' };
  const night = { shift_start: '22:00:00', shift_end: '06:00:00' };

  it('places a day shift before, during and after', () => {
    expect(getShiftWindow(day, at(7, 59)).state).toBe('upcoming');
    expect(getShiftWindow(day, at(8)).state).toBe('current');
    expect(getShiftWindow(day, at(16, 59)).state).toBe('current');
    expect(getShiftWindow(day, at(17)).state).toBe('ended');
  });

  it('treats an overnight shift as current either side of midnight', () => {
    expect(getShiftWindow(night, at(23)).state).toBe('current');
    expect(getShiftWindow(night, at(3)).state).toBe('current');
    expect(getShiftWindow(night, at(12)).state).toBe('upcoming');
    expect(getShiftWindow(night, at(12)).overnight).toBe(true);
  });

  it('is unknown without shift times', () => {
    expect(getShiftWindow({}).state).toBe('unknown');
  });
});

describe('deriveEngineerLiveStatus', () => {
  const eng = { badge_number: 'E1', name: 'Test Engineer', shift_start: '00:00:00', shift_end: '23:59:00' };

  it('is en route when dispatched to an open job', () => {
    const jobs = [{ status: 'active', engineer_badge: 'E1', engineer_dispatched_at: new Date().toISOString() }];
    expect(deriveEngineerLiveStatus(eng, jobs).status).toBe('en_route');
  });

});
