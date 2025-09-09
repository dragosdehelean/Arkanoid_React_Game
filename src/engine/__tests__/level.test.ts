import { describe, it, expect } from 'vitest';
import { buildBricksFromPattern } from '../level';

describe('level builder', () => {
  it('builds bricks from pattern', () => {
    const pattern = [
      [1, 0, 1],
      [0, 1, 0]
    ];
    const bricks = buildBricksFromPattern(pattern, 720, { enableHP: true, enableMoving: true });
    expect(bricks.length).toBe(3);
    expect(bricks[0].w).toBeGreaterThan(0);
    expect(bricks[0].h).toBeGreaterThan(0);
  });
});
