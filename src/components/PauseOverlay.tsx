import React from 'react';
import { useDispatch } from 'react-redux';
import { resume, startGame } from '../state/slices/gameSlice';
import { resetScore } from '../state/slices/scoreSlice';

const PauseOverlay: React.FC = () => {
  const dispatch = useDispatch();
  return (
    <div className="overlay">
      <div className="panel" style={{ textAlign: 'center' }}>
        <h2>Paused</h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={() => dispatch(resume())}>Resume</button>
          <button className="btn" onClick={() => { dispatch(resetScore()); dispatch(startGame()); }}>Restart</button>
        </div>
      </div>
    </div>
  );
};

export default PauseOverlay;

