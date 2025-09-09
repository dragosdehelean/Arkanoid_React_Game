import type { AppDispatch } from '../state/store';
import { addScore } from '../state/slices/scoreSlice';
import { nextLevel, setLastTime } from '../state/slices/levelSlice';
import { loseLife, levelCleared } from '../state/slices/gameSlice';
import { Ball, Paddle, Rect, Brick } from './types';
import { clamp, reflect, resolveBallRectNormal } from './physics';
import { buildBricksFromPattern } from './level';
import { LEVEL_PATTERNS } from '../levels';
import { sfx } from '../audio/sfx';
import { computeMedalForLevel, thresholdsForLevel, medalBonus } from './utils';

// Very small skeleton engine to draw placeholders and keep a fixed-step loop
export class GameEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private running = false;
  private paused = false;
  private acc = 0;
  private last = 0;
  private readonly FIXED_DT = 1 / 60; // seconds
  private worldWidth = 720;
  private worldHeight = 1280;
  private skin: 'default' | 'eco' = 'default';
  private bgGradient: CanvasGradient | null = null;
  private bgGradientSkin: 'default' | 'eco' | null = null;
  private e2e = false;
  private controlSensitivity = 1.0;
  private features = { campaign: false, timeAttack: false, multiball: false, strongBricks: true, movingBricks: true };
  private levelStartSec = 0;
  private combo = { count: 0, window: 1.8, timer: 0 };
  private baseBallSpeed = 300;
  private maxBalls = 6;

  private balls: Ball[] = [{ pos: { x: 360, y: 800 }, vel: { x: 160, y: -260 }, radius: 8 }];
  private paddle: Paddle = { x: 300, y: 1100, w: 120, h: 16, speed: 760 };
  private bricks: Brick[] = [];
  private levelIdx = 0;
  private attachedIndex: number | null = 0;
  private input = { left: false, right: false, mouseX: null as number | null };
  private powerups: { x: number; y: number; w: number; h: number; vy: number; type: 'expand' | 'multi' }[] = [];
  private basePaddleW = this.paddle.w;
  private tSec = 0; // engine elapsed seconds
  private effects = { expandUntil: 0 };
  private particles: { x: number; y: number; vx: number; vy: number; life: number; ttl: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, private dispatch: AppDispatch) {}

  private isE2E() {
    try {
      return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e');
    } catch { return false; }
  }

  initLevel() {
    const total = this.features.campaign ? 10 : 3;
    const pattern = LEVEL_PATTERNS[this.levelIdx % total];
    this.bricks = buildBricksFromPattern(pattern, this.worldWidth, { enableHP: this.features.strongBricks, enableMoving: this.features.movingBricks });
    // Speed ramp per level: +20 units per level, clamped
    const ramp = Math.min(this.levelIdx, 9) * 20;
    this.baseBallSpeed = 300 + ramp;
    this.levelStartSec = this.tSec;
    this.combo.count = 0; this.combo.timer = 0;
    if (this.e2e) {
      this.canvas.setAttribute('data-level-total', String(total));
      this.canvas.setAttribute('data-moving-bricks', String(this.bricks.some(b => !!b.motion) ? 1 : 0));
      this.canvas.setAttribute('data-strong-bricks', String(this.bricks.some(b => b.hp > 1 && b.hp < 999) ? 1 : 0));
    } else {
      this.canvas.removeAttribute('data-level-total');
      this.canvas.removeAttribute('data-moving-bricks');
      this.canvas.removeAttribute('data-strong-bricks');
    }
  }

  start() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.running = true;
    this.acc = 0;
    this.last = performance.now();
    try {
      const params = new URLSearchParams(window.location.search);
      const lvl = Number(params.get('level'));
      this.e2e = params.has('e2e');
      if (!Number.isNaN(lvl) && lvl > 0) this.levelIdx = Math.max(0, Math.floor(lvl - 1));
    } catch { this.e2e = false; }
    this.initLevel();

    // Input handlers
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'a') { this.input.left = true; this.input.mouseX = null; }
      if (e.key === 'ArrowRight' || e.key === 'd') { this.input.right = true; this.input.mouseX = null; }
      if (e.key === ' ' && this.attachedIndex != null) {
        this.launchBall(this.attachedIndex);
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      this.input.mouseX = x * (this.worldWidth / rect.width);
    };
    const onClick = () => {
      if (this.attachedIndex != null) this.launchBall(this.attachedIndex);
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('click', onClick);

    const loop = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      this.acc += dt;
      while (this.acc >= this.FIXED_DT) {
        this.step(this.FIXED_DT);
        this.acc -= this.FIXED_DT;
      }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Cleanup listeners on stop
    this.stop = () => {
      this.running = false;
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      this.canvas.removeEventListener('mousemove', onMouseMove);
      this.canvas.removeEventListener('click', onClick);
    };
  }

  stop() {
    this.running = false;
  }

  // Allow UI to change the visual skin (shapes/colors) without affecting physics
  setSkin(s: 'default' | 'eco') {
    this.skin = s;
    this.canvas.setAttribute('data-skin', s);
    // Invalidate background gradient cache on skin change
    this.bgGradient = null;
    this.bgGradientSkin = null;
  }

  setPaddleSensitivity(v: number) {
    this.controlSensitivity = Math.max(0.2, Math.min(3, v));
    if (this.e2e) this.canvas.setAttribute('data-paddle-sens', this.controlSensitivity.toFixed(2));
  }

  setFeatures(f: Partial<typeof this.features>) {
    this.features = { ...this.features, ...f };
    if (this.e2e) {
      this.canvas.setAttribute('data-time-attack', this.features.timeAttack ? '1' : '0');
      this.canvas.setAttribute('data-multiball', this.features.multiball ? '1' : '0');
    } else {
      this.canvas.removeAttribute('data-time-attack');
      this.canvas.removeAttribute('data-multiball');
    }
    this.initLevel();
    if (this.e2e && this.features.multiball && this.balls.length === 1) this.spawnExtraBalls(1);
  }

  private step(dt: number) {
    if (this.paused) return; // pause halts simulation
    this.tSec += dt;
    if (this.combo.timer > 0) this.combo.timer -= dt;
    // When using keyboard, detach mouse anchoring so it doesn't snap back
    if (this.input.left || this.input.right) {
      this.input.mouseX = null;
      const sp = this.paddle.speed * this.controlSensitivity;
      if (this.input.left) this.paddle.x -= sp * dt;
      if (this.input.right) this.paddle.x += sp * dt;
    } else if (this.input.mouseX != null) {
      this.paddle.x = this.input.mouseX - this.paddle.w / 2;
    }
    this.paddle.x = clamp(this.paddle.x, 0, this.worldWidth - this.paddle.w);

    // Update balls
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (this.attachedIndex === i) {
        ball.pos.x = this.paddle.x + this.paddle.w / 2;
        ball.pos.y = this.paddle.y - ball.radius - 1;
      }
      ball.pos.x += ball.vel.x * dt;
      ball.pos.y += ball.vel.y * dt;
      if (ball.pos.x - ball.radius < 0) { ball.pos.x = ball.radius; ball.vel.x = Math.abs(ball.vel.x); }
      else if (ball.pos.x + ball.radius > this.worldWidth) { ball.pos.x = this.worldWidth - ball.radius; ball.vel.x = -Math.abs(ball.vel.x); }
      if (ball.pos.y - ball.radius < 0) { ball.pos.y = ball.radius; ball.vel.y = Math.abs(ball.vel.y); }
      if (ball.pos.y - ball.radius > this.worldHeight) { this.balls.splice(i, 1); i--; }
    }
    if (this.balls.length === 0) {
      this.dispatch(loseLife());
      sfx.play('lose');
      const b: Ball = { pos: { x: this.paddle.x + this.paddle.w / 2, y: this.paddle.y - 9 }, vel: { x: 0, y: 0 }, radius: 8 };
      this.balls.push(b);
      this.attachedIndex = 0;
      this.paddle.w = this.basePaddleW;
      this.effects = { expandUntil: 0 };
    }

    // Paddle collisions
    for (const ball of this.balls) {
      const paddleRect: Rect = { x: this.paddle.x, y: this.paddle.y, w: this.paddle.w, h: this.paddle.h };
      const nP = resolveBallRectNormal(ball, paddleRect);
      if (nP) {
        // Reflect and add control based on hit offset
        ball.vel = reflect(ball.vel, nP);
        const hitOffset = ((ball.pos.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2));
        const maxAngle = Math.PI / 3; // 60 deg
        const speed = Math.hypot(ball.vel.x, ball.vel.y);
        const angle = -Math.PI / 2 + clamp(hitOffset, -1, 1) * maxAngle;
        ball.vel.x = Math.cos(angle) * speed;
        ball.vel.y = Math.sin(angle) * speed;
        ball.pos.y = this.paddle.y - ball.radius - 0.1;
      }
    }

    // Bricks collision (hp, moving, power-ups)
    for (let bi = 0; bi < this.balls.length; bi++) {
      const ball = this.balls[bi];
      for (let i = 0; i < this.bricks.length; i++) {
        const b = this.bricks[i] as any as Brick;
        const bx = b.motion ? (b.motion.x0 + b.motion.amp * Math.sin(this.tSec * b.motion.speed + b.motion.phase)) : b.x;
        const rect: Rect = { x: bx, y: b.y, w: b.w, h: b.h };
        const n = resolveBallRectNormal(ball, rect);
        if (n) {
          ball.vel = reflect(ball.vel, n);
          ball.pos.x += n.x * 0.8;
          ball.pos.y += n.y * 0.8;
          sfx.play('break');
          this.spawnParticles(rect.x + rect.w / 2, rect.y + rect.h / 2, 10);
          if (this.combo.timer > 0) this.combo.count += 1; else this.combo.count = 1;
          this.combo.timer = this.combo.window;
          const bonus = Math.floor((this.combo.count - 1) * 20);
          this.dispatch(addScore(100 + Math.max(0, bonus)));
          const canDestroy = b.kind !== 'indestructible';
          const willDestroy = canDestroy && (b.hp <= 1 || b.hp === 1);
          if (canDestroy) {
            if (b.hp > 1 && b.hp < 999) { b.hp = (b.hp - 1) as any; } else { this.bricks.splice(i, 1); i--; }
          }
          if (willDestroy && Math.random() < 0.12) {
            // Slightly increase chance for Multiball when enabled
            const allowMulti = this.features.multiball;
            let type: 'expand' | 'multi';
            if (allowMulti) {
              const r = Math.random();
              // ~50% multi, ~50% expand (după eliminarea Slow)
              type = r < 0.5 ? 'multi' : 'expand';
            } else {
              type = 'expand';
            }
            this.powerups.push({ x: rect.x + rect.w / 2 - 10, y: rect.y + rect.h / 2, w: 20, h: 10, vy: 180, type });
          }
          break;
        }
      }
    }

    // Power-ups fall and collide with paddle
    for (let i = 0; i < this.powerups.length; i++) {
      const p = this.powerups[i];
      p.y += p.vy * dt;
      const paddleRect: Rect = { x: this.paddle.x, y: this.paddle.y, w: this.paddle.w, h: this.paddle.h };
      const puRect: Rect = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (this.rectsOverlap(paddleRect, puRect)) {
        this.applyPowerUp(p.type);
        this.powerups.splice(i, 1);
        i--;
        sfx.play('hit');
      } else if (p.y > this.worldHeight + 40) {
        this.powerups.splice(i, 1);
        i--;
      }
    }

    // Effects maintenance
    if (this.tSec > this.effects.expandUntil) {
      this.paddle.w = this.basePaddleW;
    }
    const targetSpeed = this.baseBallSpeed;
    for (const ball of this.balls) {
      const spd = Math.hypot(ball.vel.x, ball.vel.y);
      if (spd > 0) {
        ball.vel.x = (ball.vel.x / spd) * targetSpeed;
        ball.vel.y = (ball.vel.y / spd) * targetSpeed;
      }
    }

    // Particles update
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 50 * dt; // slight gravity
      p.life += dt;
      if (p.life >= p.ttl) {
        this.particles.splice(i, 1);
        i--;
      }
    }

    if (this.bricks.length === 0) {
      if (this.features.timeAttack) {
        const elapsed = Math.max(0, this.tSec - this.levelStartSec);
        const medal = computeMedalForLevel(elapsed, this.levelIdx);
        this.canvas.setAttribute('data-last-time-sec', elapsed.toFixed(2));
        this.canvas.setAttribute('data-medal', medal);
        this.dispatch(setLastTime({ timeSec: elapsed, medal: medal as any }));
        if (medal !== 'none') {
          this.dispatch(addScore(medalBonus(medal as any)));
        }
      }
      this.dispatch(levelCleared());
      this.dispatch(nextLevel());
      this.levelIdx += 1;
      this.initLevel();
    }
  }

  private render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: w, clientHeight: h } = this.canvas;
    const scaleX = (w * dpr) / this.worldWidth;
    const scaleY = (h * dpr) / this.worldHeight;
    const scale = Math.min(scaleX, scaleY);
    const cw = Math.floor(this.worldWidth * scale);
    const ch = Math.floor(this.worldHeight * scale);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);

    // Background glow bands (cached per skin)
    if (!this.bgGradient || this.bgGradientSkin !== this.skin) {
      const g = ctx.createLinearGradient(0, 0, 0, this.worldHeight);
      if (this.skin === 'eco') {
        g.addColorStop(0, 'rgba(102, 187, 106, 0.07)');
        g.addColorStop(1, 'rgba(67, 160, 71, 0.07)');
      } else {
        g.addColorStop(0, 'rgba(80, 227, 194, 0.06)');
        g.addColorStop(1, 'rgba(155, 92, 246, 0.06)');
      }
      this.bgGradient = g;
      this.bgGradientSkin = this.skin;
    }
    ctx.fillStyle = this.bgGradient!;
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Bricks
    if (this.skin === 'eco') {
      for (const b of this.bricks) {
        const bx = (b as any).motion ? ((b as any).motion.x0 + (b as any).motion.amp * Math.sin(this.tSec * (b as any).motion.speed + (b as any).motion.phase)) : b.x;
        this.drawLeaf(ctx, bx, b.y, b.w, b.h, true);
      }
    } else {
      for (const b of this.bricks) {
        const bx = (b as any).motion ? ((b as any).motion.x0 + (b as any).motion.amp * Math.sin(this.tSec * (b as any).motion.speed + (b as any).motion.phase)) : b.x;
        const strength = (b as any).kind === 'indestructible' ? 0.2 : ((b as any).hp >= 3 ? 0.95 : (b as any).hp === 2 ? 0.8 : 0.6);
        ctx.fillStyle = `rgba(80, 227, 194, ${strength})`;
        ctx.beginPath();
        ctx.roundRect(bx, b.y, b.w, b.h, 6);
        ctx.fill();
      }
    }

    // Paddle
    if (this.skin === 'eco') {
      const ph = this.paddle.h * 1.6; // slightly taller visual leaf
      const py = this.paddle.y + (this.paddle.h - ph) / 2;
      this.drawLeaf(ctx, this.paddle.x, py, this.paddle.w, ph, false);
    } else {
      ctx.fillStyle = 'rgba(155, 92, 246, 0.9)';
      ctx.beginPath();
      ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h, 8);
      ctx.fill();
    }

    // Balls
    for (const ball of this.balls) {
      if (this.skin === 'eco') {
        this.drawDewDrop(ctx, ball.pos.x, ball.pos.y, ball.radius);
      } else {
        ctx.fillStyle = '#e6eaf2';
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // E2E-only attributes (avoid per-frame DOM mutations outside tests)
    if (this.e2e) {
      const fb = this.balls[0];
      this.canvas.setAttribute('data-ball-x', String(Math.round(fb?.pos.x ?? 0)));
      this.canvas.setAttribute('data-ball-y', String(Math.round(fb?.pos.y ?? 0)));
      this.canvas.setAttribute('data-balls', String(this.balls.length));
      this.canvas.setAttribute('data-bricks', String(this.bricks.length));
      this.canvas.setAttribute('data-paddle-x', String(Math.round(this.paddle.x)));
      this.canvas.setAttribute('data-paddle-w', String(Math.round(this.paddle.w)));
      if (this.features.timeAttack) {
        const elapsed = Math.max(0, this.tSec - this.levelStartSec);
        this.canvas.setAttribute('data-elapsed', elapsed.toFixed(1));
        const medalNow = computeMedalForLevel(elapsed, this.levelIdx);
        this.canvas.setAttribute('data-medal-now', medalNow);
        const thr = thresholdsForLevel(this.levelIdx);
        this.canvas.setAttribute('data-thr-gold', String(thr.gold));
        this.canvas.setAttribute('data-thr-silver', String(thr.silver));
        this.canvas.setAttribute('data-thr-bronze', String(thr.bronze));
      } else {
        this.canvas.removeAttribute('data-elapsed');
        this.canvas.removeAttribute('data-medal-now');
        this.canvas.removeAttribute('data-thr-gold');
        this.canvas.removeAttribute('data-thr-silver');
        this.canvas.removeAttribute('data-thr-bronze');
      }
    }

    // Power-ups
    for (const p of this.powerups) {
      const eco = this.skin === 'eco';
      ctx.fillStyle = eco
        ? (p.type === 'expand' ? 'rgba(102,187,106,0.9)' : 'rgba(129,199,132,0.9)')
        : (p.type === 'expand' ? 'rgba(80,227,194,0.85)' : 'rgba(255, 214, 102, 0.9)');
      ctx.beginPath();
      if (eco) {
        // small seed capsule
        const r = Math.min(p.w, p.h) * 0.5;
        ctx.roundRect(p.x, p.y, p.w, p.h, r);
      } else {
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
      }
      ctx.fill();
      // icon
      ctx.fillStyle = eco ? '#e8f5e9' : '#0b1020';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = p.type === 'expand' ? 'E' : 'M';
      ctx.fillText(label, p.x + p.w / 2, p.y + p.h / 2 + 0.5);
    }

    // Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.ttl) * 0.6;
      ctx.fillStyle = `rgba(230,234,242,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private launchBall(index?: number) {
    this.attachedIndex = null;
    const speed = this.baseBallSpeed;
    const angle = -Math.PI / 3; // 60° upward
    const b = this.balls[index ?? 0];
    b.vel.x = Math.cos(angle) * speed;
    b.vel.y = Math.sin(angle) * speed;
  }

  private rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private applyPowerUp(type: 'expand' | 'multi') {
    const now = this.tSec;
    if (type === 'expand') {
      this.paddle.w = this.basePaddleW * 1.5;
      this.effects.expandUntil = Math.max(this.effects.expandUntil, now + 6);
    } else if (type === 'multi' && this.features.multiball) {
      this.spawnExtraBalls(2);
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.canvas.setAttribute('data-paused', paused ? '1' : '0');
  }

  private spawnParticles(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, ttl: 0.4 + Math.random() * 0.4 });
    }
  }

  private spawnExtraBalls(n: number) {
    const toSpawn = Math.max(0, Math.min(n, this.maxBalls - this.balls.length));
    if (toSpawn <= 0) return;
    const base = this.balls[0];
    for (let i = 0; i < toSpawn; i++) {
      const ang = (-Math.PI / 3) + (i - (toSpawn - 1) / 2) * 0.3;
      const speed = this.baseBallSpeed;
      const b: Ball = { pos: { x: base.pos.x, y: base.pos.y }, vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed }, radius: 8 };
      this.balls.push(b);
    }
  }

  // Draw a stylized leaf shape within the given rect
  private drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, forBrick: boolean) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    // upper curve to tip
    ctx.bezierCurveTo(cx - rx * 0.4, y - ry * 0.2, cx + rx * 0.2, y - ry * 0.2, x + w, cy);
    // lower curve back to start
    ctx.bezierCurveTo(cx + rx * 0.2, y + h + ry * 0.2, cx - rx * 0.4, y + h + ry * 0.2, x, cy);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, forBrick ? 'rgba(129, 199, 132, 0.95)' : 'rgba(102, 187, 106, 0.95)');
    grad.addColorStop(1, forBrick ? 'rgba(76, 175, 80, 0.95)' : 'rgba(67, 160, 71, 0.95)');
    ctx.fillStyle = grad;
    ctx.fill();
    // central vein
    ctx.strokeStyle = 'rgba(232, 245, 233, 0.6)';
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.04);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, cy);
    ctx.quadraticCurveTo(cx, cy - ry * 0.2, x + w * 0.92, cy);
    ctx.stroke();
  }

  // Draw a small dew drop with highlight
  private drawDewDrop(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.0, 1.2);
    const grad = ctx.createRadialGradient(0, -r * 0.3, r * 0.2, 0, 0, r * 1.2);
    grad.addColorStop(0, 'rgba(232,245,233,1)');
    grad.addColorStop(1, 'rgba(102,187,106,0.95)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // E2E-only helpers
  public e2eClearLevel() {
    if (!this.isE2E()) return;
    this.bricks = [] as any;
  }

  public e2eSpawnPowerUp(type: 'expand' | 'multi') {
    if (!this.isE2E()) return;
    const x = this.paddle.x + this.paddle.w / 2 - 10;
    const y = this.paddle.y + this.paddle.h / 2 - 5; // overlap paddle for instant pickup
    this.powerups.push({ x, y, w: 20, h: 10, vy: 0, type });
  }

  public e2eSpawnExtraBalls(n: number) {
    if (!this.isE2E()) return;
    this.spawnExtraBalls(Math.max(1, Math.floor(n)));
  }
}
