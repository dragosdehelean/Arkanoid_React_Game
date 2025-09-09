import React from 'react';
import { useDispatch } from 'react-redux';
import { startGame } from '../state/slices/gameSlice';
import { clearMedals } from '../state/slices/levelSlice';
import { resetScore } from '../state/slices/scoreSlice';
import { toggleSettings } from '../state/slices/settingsSlice';
import { sfx } from '../audio/sfx';

const Menu: React.FC = () => {
  const dispatch = useDispatch();
  const onStart = () => {
    sfx.play('click');
    dispatch(resetScore());
    dispatch(clearMedals());
    dispatch(startGame());
  };
  return (
    <div className="overlay">
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Arkanoid — Modern MVP</h1>
        <p>
          How to Play:
          <br />
          - Move paddle with Arrow Keys or mouse.
          <br />
          - Launch ball with Space or click.
          <br />
          - Break all bricks to clear the level.
          <br />
          - Catch power-ups: E = Expand paddle, M = Multiball.
          <br />
          <br />
          New Features:
          <br />
          - Campaign (10 Levels): dificultate în creștere (viteza mingii crește ușor pe nivel, apar cărămizi cu HP și cărămizi mobile/indestructibile).
          <br />
          - Time Attack: ești cronometrat; pragurile pentru Gold/Silver/Bronze cresc cu nivelul. Timerul și pragurile curente apar în HUD.
          <br />
          - Medals History: medaliile câștigate în sesiunea curentă apar ca insigne în HUD și acordă bonus de scor.
          <br />
          - Multiball: multiplică mingea (limitat la 6 bile simultan pentru claritate și performanță).
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" onClick={onStart}>Start</button>
          <button className="btn" onClick={() => { sfx.play('click'); dispatch(toggleSettings()); }}>Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
