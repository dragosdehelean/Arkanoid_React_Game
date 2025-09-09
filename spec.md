# Arkanoid (1986) — MVP Plan (React 18 + Vite + Redux Toolkit)

A modern, responsive MVP with a contemporary look (soft neon/glassmorphism, subtle micro‑animations), targeting 60 FPS on desktop and mobile. Gameplay mirrors the core Arkanoid loop: paddle, ball, bricks, score, lives, and a few predefined levels.

## 1) Goals & Scope
- Goal: smooth, clear, fun experience with a complete core loop.
- Non‑goals for MVP: level editor, numerous/complex power‑ups, boss fights, long progression, advanced shaders.

## 2) Tech Stack & Architecture
- Stack: React 18, Vite, Redux Toolkit (RTK). TypeScript recommended (optional, but preferred).
- Rendering: Canvas 2D for the game (performance), React for UI (HUD, menus).
- Game loop: `requestAnimationFrame` with a fixed timestep (accumulator) and deterministic collisions.
- State management: RTK for UI/meta state (score, lives, level, game status). Per‑frame state (ball/paddle/brick positions) remains inside the engine (refs), not in Redux, to avoid costly rerenders.
- Engine ↔ Redux: the engine emits discrete events (e.g., "brickDestroyed", "lifeLost", "levelCleared"); Redux updates meta‑state; UI subscribes with selectors.

## 3) Core Gameplay
- Single active ball (MVP). Launch with Space/click.
- One paddle controlled via keyboard (Left/Right) and mouse/touch (optional for mobile).
- Static brick grid per level; 3 predefined levels (JSON/TS config).
- Scoring: +50 on hit, +100 on destroy (tunable). Small bonus on clearing streaks.
- Lives: 3 lives. Lose a life when the ball drops below the bottom edge.
- Minimal power‑ups: "Expand Paddle" (short), "Slow Ball" (short). Low drop chance (10–15%).
- Status flow: `menu → playing → paused → levelCleared → gameOver`.
- High score saved in `localStorage`.

## 4) Physics & Collisions (MVP)
- Coordinate system: canvas world (px). Logical canvas 720×1280 with responsive letterboxing; scale by device DPR.
- Ball movement: constant speed, normalized direction; clamp `dt`.
- Collisions: simple AABB for bricks and walls; paddle as rect, ball as circle (approximated vs AABB) — sufficient for MVP.
- Paddle reflection: angle based on impact point (simple spin). Example: `offset = (hitX - paddleCenterX) / (paddleWidth/2)`, mapped to a max angle (±60°).
- Fixed step: 60 Hz (16.67 ms) with an accumulator; integration decoupled from rAF for stability.

## 5) Modern Visual Style (not retro)
- Palette: dark background with a subtle gradient (e.g., #0b1020 → #131a2e), neon accents (cyan, magenta, lime) with a soft glow (low shadow blur).
- Style: light glassmorphism for UI (blur + transparency), slightly rounded corners, flat elements, clean grid.
- Typography: "Inter" / "Urbanist" / "Orbitron" (for titles). High‑contrast UI text, 14–18px.
- Micro‑animations: hover states, fade/slide overlays, small scale pulses when bricks break.
- SFX: subtle; UI click, "full" brick hit, "soft" lose life. Mute toggle.

## 6) Project Structure
```
src/
  main.tsx
  App.tsx
  styles/
    theme.css        // CSS variables for colors/glow
  state/
    store.ts
    slices/
      gameSlice.ts      // status, lives, pause
      scoreSlice.ts     // score, highScore
      levelSlice.ts     // level index, current layout
      settingsSlice.ts  // volume, preferences
  engine/
    engine.ts        // GameEngine (loop + orchestration)
    types.ts         // Vector, Rect, Ball, Brick, Level
    physics.ts       // integration, collisions, reflections
    level.ts         // level loader, simple generator
    rng.ts           // deterministic rng (optional)
  components/
    GameCanvas.tsx
    HUD.tsx          // score, lives, level
    Menu.tsx
    PauseOverlay.tsx
    LevelCleared.tsx
    GameOver.tsx
    Settings.tsx (optional)
  assets/
    sfx/
      hit.wav
      break.wav
      lose.wav
      click.wav
```

## 7) RTK Slices (proposed)
- `gameSlice`
  - state: `{ status: 'menu'|'playing'|'paused'|'levelCleared'|'gameOver', lives: number, muted: boolean }`
  - reducers: `startGame`, `pause`, `resume`, `loseLife`, `gameOver`, `levelCleared`, `toggleMute`.
- `scoreSlice`
  - state: `{ score: number, highScore: number }`
  - reducers: `addScore(amount)`, `resetScore()`, `commitHighScore()`.
- `levelSlice`
  - state: `{ current: number, total: number, layout: Brick[][] }`
  - reducers: `loadLevel(index)`, `nextLevel()`, `setLayout(layout)`.
- `settingsSlice`
  - state: `{ volume: number, theme: 'auto'|'light'|'dark' }`
  - reducers: `setVolume(v)`, `setTheme(t)`.

Note: The engine dispatches to these slices only on discrete events; entity positions do not go through Redux per frame.

## 8) Entities & Models
- `Vector2 { x, y }`, `Rect { x, y, w, h }`
- `Ball { pos: Vector2, vel: Vector2, radius: number }`
- `Paddle { x, y, w, h, speed }`
- `Brick { x, y, w, h, hp: 1|2, kind: 'normal'|'strong'|'indestructible', drop?: 'expand'|'slow' }`
- `Level { id, rows, cols, bricks: Brick[] }`

## 9) Game Loop (sketch)
Pseudo:
```ts
class GameEngine {
  start(ctx, dispatch) { /* set refs, init, bind input */ }
  loop = (tNow) => {
    // accumulate dt; fixed‑step updates
    accumulate dt; while (acc >= FIXED_DT) { this.step(FIXED_DT); acc -= FIXED_DT }
    this.render(); requestAnimationFrame(this.loop);
  }
  step(dt) {
    // integrate ball; resolve walls, paddle, bricks
    integrate ball; resolve walls; resolve paddle; resolve bricks;
    if (brickDestroyed) dispatch(addScore(100));
    if (noBricksLeft) dispatch(levelCleared());
    if (ballBelowBottom) dispatch(loseLife());
  }
  render() { clear; draw bricks; draw paddle; draw ball; subtle postFX }
}
```

## 10) Controls & Input
- Keyboard: `ArrowLeft/ArrowRight` (move paddle), `Space` (launch/pause in menu), `P` (pause).
- Mouse: horizontal movement synced to paddle; click = launch.
- Touch (MVP): horizontal drag; tap = launch.
- Safety: lock input when `paused`/`menu`.

## 11) UI & Screen Flow
- `Menu`: title, "Start", "Settings", high score.
- `HUD`: current score, lives (icons), current level; top placement.
- `PauseOverlay`: semi‑transparent; "Resume", "Restart", "Menu".
- `LevelCleared`: short animation + "Next level".
- `GameOver`: final score, high score, "Try again".

## 12) Levels (MVP)
- 3 static layouts (`level-1.json`, `level-2.json`, `level-3.json` or TS exports) with clean, modern color patterns.
- Difficulty increases via density and brick HP.

## 13) Audio
- HTMLAudio or simple WebAudio (small preload). SFX: hit, break, lose, UI click.
- Volume control + mute in `settingsSlice`.

## 14) Performance & Stability
- No per‑frame dispatches. Only discrete events.
- Canvas size adapted to DPR; clear with `ctx.setTransform(scale,0,0,scale,0,0)`.
- Clamp dt; tunneling prevention via limited sub‑stepping if speed is high.
- Auto‑pause on `document.visibilitychange`.

## 15) Testing (targeted, pragmatic)
- Unit tests for utilities: `reflect()`, `intersectAABB()`, `resolveBallBrick()`.
- RTK reducers: basic tests for `loseLife`, `addScore`, `levelCleared`.

## 16) Acceptance Criteria (MVP)
- Core loop: ball hits paddle/bricks and reflects correctly at ~60 FPS.
- 3 levels playable end‑to‑end; auto progress `levelCleared → next`.
- Score and lives update correctly; high score persists.
- Pause/resume functional; keyboard + mouse input works.
- Modern, readable, responsive UI; SFX on key events; Mute toggle.

## 17) Implementation Plan (milestones)
1. Scaffold project with Vite + React + RTK; store and slices (½ day).
2. Canvas + GameEngine skeleton, keyboard input, draw paddle/ball (1 day).
3. Core physics: walls, paddle, reflections, fixed‑dt integration (1 day).
4. Brick grid + collisions + scoring (1 day).
5. UI: HUD, Menu, Pause, GameOver + state flow (1 day).
6. Static levels + LevelCleared + next level (½ day).
7. Simple power‑ups (expand, slow) + pickup logic (½ day).
8. Audio + volume/mute settings + polish (½ day).
9. Utility and reducer tests + bugfix pass (½ day).

Total estimate: ~5–6 person‑days (MVP).

## 18) Possible Extensions (post‑MVP)
- Multiball, laser, sticky paddle, shrink paddle, controlled speed‑up.
- RTK Query for an online leaderboard.
- Level editor, sharing, multiple saves.
- PWA + offline cache, home screen install.
- Shaders (WebGL) for advanced glow/particles.

## 19) Implementation Notes
- Avoid putting entity positions in Redux; keep them in the engine (refs) and render directly to the canvas.
- UI components are "pure" Redux‑driven; `GameCanvas` receives only engine refs and selectors for meta.
- Measure performance: if React Strict Mode doubles effects in dev, consider disabling Strict Mode for the canvas subtree in dev.

