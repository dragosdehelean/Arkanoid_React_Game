import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startGame } from '../state/slices/gameSlice';
import type { RootState } from '../state/store';

const LevelCleared: React.FC = () => {
  const dispatch = useDispatch();
  const timeAttack = useSelector((s: RootState) => s.settings.timeAttack);
  const lastTime = useSelector((s: RootState) => s.level.lastTimeSec);
  const lastMedal = useSelector((s: RootState) => s.level.lastMedal);
  return (
    <div className="overlay">
      <div className="panel" style={{ textAlign: 'center' }}>
        <h2>Level Cleared!</h2>
        {timeAttack && (
          <p aria-label="Medal">
            Medal: {lastMedal ?? '—'} {typeof lastTime === 'number' ? `(${lastTime.toFixed(1)}s)` : ''}
          </p>
        )}
        <button className="btn" onClick={() => dispatch(startGame())}>Next Level</button>
      </div>
    </div>
  );
};

export default LevelCleared;
