import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './state/store';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Menu from './components/Menu';
import PauseOverlay from './components/PauseOverlay';
import LevelCleared from './components/LevelCleared';
import GameOver from './components/GameOver';
import E2EDebug from './components/E2EDebug';
import Settings from './components/Settings';

const App: React.FC = () => {
  const status = useSelector((s: RootState) => s.game.status);

  return (
    <div className="app-root">
      <GameCanvas />
      <HUD />
      {status === 'menu' && <Menu />}
      {status === 'paused' && <PauseOverlay />}
      {status === 'levelCleared' && <LevelCleared />}
      {status === 'gameOver' && <GameOver />}
      <Settings />
      <E2EDebug />
    </div>
  );
};

export default App;
