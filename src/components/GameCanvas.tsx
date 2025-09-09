import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../state/store';
import { GameEngine } from '../engine/engine';
import { setTotal } from '../state/slices/levelSlice';

const GameCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const status = useSelector((s: RootState) => s.game.status);
  const theme = useSelector((s: RootState) => s.settings.theme);
  const dispatch = useDispatch<AppDispatch>();
  const paddleSensitivity = useSelector((s: RootState) => s.settings.paddleSensitivity);
  const campaign = useSelector((s: RootState) => s.settings.campaign);
  const timeAttack = useSelector((s: RootState) => s.settings.timeAttack);
  const multiball = useSelector((s: RootState) => s.settings.multiball);
  const strongBricks = useSelector((s: RootState) => s.settings.strongBricks);
  const movingBricks = useSelector((s: RootState) => s.settings.movingBricks);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isE2E = !!params?.has('e2e');
    const forceEngine = params?.get('engine') === '1';
    if (isE2E && !forceEngine) return; // Skip engine in e2e unless explicitly enabled
    const engine = new GameEngine(canvas, dispatch);
    engineRef.current = engine;
    engine.start();
    // initialize skin based on current theme
    engine.setSkin(theme === 'eco' ? 'eco' : 'default');
    // initialize control sensitivity
    engine.setPaddleSensitivity(paddleSensitivity);
    // pass features
    engine.setFeatures({ campaign, timeAttack, multiball, strongBricks, movingBricks });
    // expose E2E handle
    if (isE2E) (window as any).arkEngine = engine;
    return () => { engine.stop(); engineRef.current = null; };
  }, [dispatch]);

  // Sync pause with game status
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setPaused(status !== 'playing');
  }, [status]);

  // Sync visual skin with theme
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setSkin(theme === 'eco' ? 'eco' : 'default');
  }, [theme]);

  // Sync paddle sensitivity with engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setPaddleSensitivity(paddleSensitivity);
  }, [paddleSensitivity]);

  // Sync feature toggles
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setFeatures({ campaign, timeAttack, multiball, strongBricks, movingBricks });
    // set total levels for campaign
    dispatch(setTotal(campaign ? 10 : 3));
  }, [campaign, timeAttack, multiball, strongBricks, movingBricks, dispatch]);

  // Optionally dim the canvas when paused/menu
  const opacity = status === 'playing' ? 1 : 0.8;

  return <canvas className="game-canvas" ref={ref} style={{ opacity }} />;
};

export default GameCanvas;
