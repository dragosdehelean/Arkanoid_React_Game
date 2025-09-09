export interface Vector2 { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export interface Ball {
  pos: Vector2;
  vel: Vector2; // units per second in logical pixels
  radius: number;
}

export interface Paddle {
  x: number; y: number; w: number; h: number; speed: number;
}

export type BrickKind = 'normal' | 'strong' | 'indestructible';
export interface BrickMotion { type: 'slide'; amp: number; speed: number; phase: number; x0: number }
export interface Brick { x: number; y: number; w: number; h: number; hp: 1 | 2 | 3 | 999; kind: BrickKind; drop?: 'expand' | 'multi'; motion?: BrickMotion }

export interface Level { id: string; rows: number; cols: number; bricks: Brick[] }

export const VEC = {
  add: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y }),
  dot: (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y,
  mul: (a: Vector2, s: number): Vector2 => ({ x: a.x * s, y: a.y * s }),
  len: (a: Vector2): number => Math.hypot(a.x, a.y),
  norm: (a: Vector2): Vector2 => {
    const L = Math.hypot(a.x, a.y) || 1;
    return { x: a.x / L, y: a.y / L };
  }
};
