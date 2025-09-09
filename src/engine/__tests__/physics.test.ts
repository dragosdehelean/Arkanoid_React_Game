import { describe, it, expect } from 'vitest';
import { reflect, intersectAABB, resolveBallRectNormal } from '../physics';

describe('physics utilities', () => {
  it('reflects vector on normal', () => {
    const v = { x: 1, y: -1 };
    const n = { x: 0, y: 1 }; // reflect on horizontal surface
    const r = reflect(v, n);
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(1);
  });

  it('intersects AABB correctly', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    const c = { x: 20, y: 20, w: 5, h: 5 };
    expect(intersectAABB(a, b)).toBe(true);
    expect(intersectAABB(a, c)).toBe(false);
  });

  it('resolves ball-rect collision normal', () => {
    const ball = { pos: { x: 5, y: 5 }, vel: { x: 1, y: 1 }, radius: 2 };
    const rect = { x: 7, y: 0, w: 4, h: 10 };
    const n = resolveBallRectNormal(ball as any, rect);
    expect(n).not.toBeNull();
    if (n) expect(Math.hypot(n.x, n.y)).toBeCloseTo(1);
  });
});

