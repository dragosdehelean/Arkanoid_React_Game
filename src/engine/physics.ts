import { Rect, Vector2, Ball, VEC } from './types';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Reflect a velocity vector on a surface normal (normal must be normalized)
export function reflect(vel: Vector2, normal: Vector2): Vector2 {
  const n = VEC.norm(normal);
  const d = VEC.dot(vel, n);
  return VEC.sub(vel, VEC.mul(n, 2 * d));
}

export function intersectAABB(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleIntersectsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

// Compute a collision normal for ball-vs-rect, based on minimum penetration
export function resolveBallRectNormal(ball: Ball, rect: Rect): Vector2 | null {
  if (!circleIntersectsRect(ball.pos.x, ball.pos.y, ball.radius, rect)) return null;

  // Find overlap on each side using the ball's center as reference
  const leftPen = ball.pos.x + ball.radius - rect.x;
  const rightPen = rect.x + rect.w - (ball.pos.x - ball.radius);
  const topPen = ball.pos.y + ball.radius - rect.y;
  const botPen = rect.y + rect.h - (ball.pos.y - ball.radius);

  const minPen = Math.min(leftPen, rightPen, topPen, botPen);
  if (minPen === leftPen) return { x: -1, y: 0 };
  if (minPen === rightPen) return { x: 1, y: 0 };
  if (minPen === topPen) return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

