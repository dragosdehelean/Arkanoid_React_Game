import { describe, it, expect } from 'vitest';
import { computeMedalForLevel, comboBonus } from '../utils';

describe('utils', () => {
  it('computes medals by time (level 0)', () => {
    expect(computeMedalForLevel(20, 0)).toBe('gold');
    expect(computeMedalForLevel(45, 0)).toBe('gold');
    expect(computeMedalForLevel(46, 0)).toBe('silver');
    expect(computeMedalForLevel(75, 0)).toBe('silver');
    expect(computeMedalForLevel(100, 0)).toBe('bronze');
    expect(computeMedalForLevel(121, 0)).toBe('none');
  });
  it('computes combo bonus', () => {
    expect(comboBonus(1)).toBe(0);
    expect(comboBonus(2)).toBe(20);
    expect(comboBonus(5)).toBe(80);
  });
});
