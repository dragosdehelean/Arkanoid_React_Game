import type { Brick } from './types';

export interface BuildOptions {
  enableHP: boolean;
  enableMoving: boolean;
}

// Pattern codes:
// 0 empty
// 1 normal hp1
// 2 strong hp2
// 3 strong hp3
// 9 indestructible
// 5..7 moving variants (hp1..3)
export function buildBricksFromPattern(pattern: number[][], worldWidth: number, opts: BuildOptions): Brick[] {
  const rows = pattern.length;
  const cols = pattern[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return [];
  const pad = 8;
  const startY = 120;
  const gridW = worldWidth - pad * 2;
  const gridH = 220; // fixed height for bricks band
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const code = pattern[r][c] | 0;
      if (code <= 0) continue;
      const x = pad + c * cellW + 2;
      const y = startY + r * cellH + 2;
      const w = cellW - 4;
      const h = cellH - 4;
      let hp: 1 | 2 | 3 | 999 = 1;
      let kind: 'normal' | 'strong' | 'indestructible' = 'normal';
      let moving = false;
      switch (code) {
        case 1: hp = 1; kind = 'normal'; break;
        case 2: hp = opts.enableHP ? 2 : 1; kind = opts.enableHP ? 'strong' : 'normal'; break;
        case 3: hp = opts.enableHP ? 3 : 1; kind = opts.enableHP ? 'strong' : 'normal'; break;
        case 9: hp = 999; kind = 'indestructible'; break;
        case 5: moving = true; hp = 1; break;
        case 6: moving = true; hp = opts.enableHP ? 2 : 1; kind = opts.enableHP ? 'strong' : 'normal'; break;
        case 7: moving = true; hp = opts.enableHP ? 3 : 1; kind = opts.enableHP ? 'strong' : 'normal'; break;
        default: hp = 1; kind = 'normal'; break;
      }
      const brick = { x, y, w, h, hp, kind } as Brick;
      if (moving && opts.enableMoving) {
        const phase = (r * 0.7 + c * 0.37) % (Math.PI * 2);
        (brick as Brick).motion = { type: 'slide', amp: Math.min(30, cellW * 0.3), speed: 1 + (r % 3) * 0.4, phase, x0: x };
      }
      bricks.push(brick);
    }
  }
  return bricks;
}
