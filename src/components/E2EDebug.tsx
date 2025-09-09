import React from 'react';
import { useDispatch } from 'react-redux';
import { startGame, loseLife, levelCleared as setLevelCleared, gameOver as setGameOver } from '../state/slices/gameSlice';
import { addScore, resetScore } from '../state/slices/scoreSlice';

const E2EDebug: React.FC = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const enabled = !!params?.has('e2e');
  const dispatch = useDispatch();
  if (!enabled) return null;
  return (
    <div data-testid="e2e-panel" style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 8, zIndex: 1000 }}>
      <button className="btn" onClick={() => { dispatch(resetScore()); dispatch(startGame()); }}>Debug Start</button>
      <button className="btn" onClick={() => dispatch(addScore(100))}>Debug Add 100 Score</button>
      <button className="btn" onClick={() => dispatch(loseLife())}>Debug Lose Life</button>
      <button className="btn" onClick={() => dispatch(setLevelCleared())}>Debug Level Cleared</button>
      <button className="btn" onClick={() => dispatch(setGameOver())}>Debug Game Over</button>
    </div>
  );
};

export default E2EDebug;

