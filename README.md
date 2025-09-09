# Arkanoid — Modern React MVP

A modern, responsive take on the classic Arkanoid core loop built with React 18, Vite, and Redux Toolkit. Gameplay runs on an HTML5 Canvas with a contemporary look (soft neon/eco visuals) and includes unit, integration, and E2E tests.

## Features
- Core gameplay: paddle, ball(s), bricks, score, lives
- Fixed-timestep engine for stable physics at ~60 FPS
- Power-ups: Expand (E), Multiball (M)
- Modern UI overlays: Menu, HUD, Pause, Level Cleared (with medals), Game Over
- Settings panel: volume, theme (auto/light/dark/eco), paddle sensitivity, gameplay toggles
- High score persistence (`localStorage`)
- Tests: Vitest (unit/integration) + Playwright (E2E)

## Tech Stack
- React 18 + Vite
- Redux Toolkit (RTK)
- TypeScript
- Vitest + Testing Library + jsdom
- Playwright (Chromium + Firefox projects)

## Getting Started
Prerequisites: Node.js 18+ (or 20+ recommended)

Install dependencies:
- `npm install`

Start the dev server:
- `npm run dev`

Build for production:
- `npm run build`

Preview the production build:
- `npm run preview`

## Scripts
- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build to `dist/`
- `npm run preview` — preview the production build
- `npm test` — run Vitest (unit/integration)
- `npm run test:watch` — Vitest watch mode
- `npm run test:e2e` — run Playwright E2E tests (uses Vite preview)
- `npm run test:e2e:ui` — Playwright UI mode
- `npm run preview:e2e` — build + preview on port 5175 (used by E2E)

Before running E2E tests the first time, install browsers:
- `npx playwright install`

## E2E Notes
- The E2E tests run against the production build served on `http://localhost:5175`.
- Add `?e2e=1` in the URL to enable deterministic E2E helpers:
  - The engine is skipped by default in E2E mode to avoid flakiness.
  - Add `&engine=1` to explicitly enable the engine during E2E.
  - An E2E debug panel appears with helper buttons (only in `?e2e=1`) to trigger Redux actions.
- The canvas exposes attributes for tests: `data-ball-x`, `data-ball-y`, `data-balls`, `data-skin`, `data-level-total`, `data-time-attack`, `data-multiball`, `data-strong-bricks`, `data-moving-bricks`.

## Controls & How To Play
- Move the paddle: Arrow Left/Right or mouse; keyboard has priority when held
- Launch the ball: Spacebar or click
- Pause: `P` or Pause button
- Break all bricks to clear the level
- Catch power-ups:
  - `E` = Expand paddle (temporary)
  - `M` = Multiball (spawns extra balls)

## Gameplay Settings
- Campaign (10 Levels): expands from 3 to 10 curated patterns with difficulty curve.
- Time Attack: times your level clear; medals: Gold (≤45s), Silver (≤75s), Bronze (≤120s).
- Multiball: allows multiball power-up and spawns extra balls in test mode.
- Strong Bricks (HP 2–3): bricks may require multiple hits; color intensity reflects HP.
- Moving Bricks: some bricks oscillate horizontally.
- Paddle Sensitivity: scales keyboard control speed (0.5x–2.0x).

## Architecture
- Rendering: Canvas 2D for the game, React for UI overlays (HUD/Menu/etc.)
- State management: RTK for UI/meta (score/lives/level/status/settings). Per-frame entity data lives in the engine, not Redux.
- Engine + Redux: the engine dispatches discrete events (brick destroyed, lose life, level cleared). No per-frame dispatches.
- Loop: `requestAnimationFrame` + fixed-timestep accumulator for deterministic physics.

## Project Structure
```
src/
  App.tsx
  main.tsx
  styles/theme.css
  components/…         # Canvas + UI overlays
  engine/…             # loop, physics, types, level builder
  levels/…             # level patterns (10 for campaign)
  state/…              # RTK store + slices + persistence
  audio/sfx.ts         # lightweight WebAudio tones

e2e/                   # Playwright specs
```

## Theming
- Theme variables live in `src/styles/theme.css`.
- Settings panel: `auto`, `light`, `dark`, `eco` (eco tints images/canvas and applies eco visuals).

## Persistence
- High score is stored in `localStorage` under the key `arkanoid:highScore`.

## Acknowledgements
- Inspired by Arkanoid (1986), Taito.

## License
- No license specified. Please contact the author before redistribution.
