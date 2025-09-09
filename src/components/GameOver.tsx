import React from 'react';
import { useDispatch } from 'react-redux';
import { commitHighScore, resetScore } from '../state/slices/scoreSlice';
import { startGame } from '../state/slices/gameSlice';

const GameOver: React.FC = () => {
  const dispatch = useDispatch();
  const restart = () => {
    dispatch(commitHighScore());
    dispatch(resetScore());
    dispatch(startGame());
  };
  return (
    <div className="overlay">
      <div className="panel" style={{ textAlign: 'center' }}>
        <h2>Game Over</h2>
        <p>Try again to beat your high score.</p>
        <button className="btn" onClick={restart}>Try Again</button>
      </div>
    </div>
  );
};

export default GameOver;

