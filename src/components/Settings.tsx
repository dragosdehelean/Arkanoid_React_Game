import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import { closeSettings, setTheme, setVolume, setPaddleSensitivity, setCampaign, setTimeAttack, setMultiball, setStrongBricks, setMovingBricks } from '../state/slices/settingsSlice';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const open = useSelector((s: RootState) => s.settings.open);
  const volume = useSelector((s: RootState) => s.settings.volume);
  const theme = useSelector((s: RootState) => s.settings.theme);
  const paddleSensitivity = useSelector((s: RootState) => s.settings.paddleSensitivity);
  const campaign = useSelector((s: RootState) => s.settings.campaign);
  const timeAttack = useSelector((s: RootState) => s.settings.timeAttack);
  const multiball = useSelector((s: RootState) => s.settings.multiball);
  const strongBricks = useSelector((s: RootState) => s.settings.strongBricks);
  const movingBricks = useSelector((s: RootState) => s.settings.movingBricks);

  useEffect(() => {
    // apply theme class
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-eco');
    if (theme === 'light') root.classList.add('theme-light');
    if (theme === 'dark') root.classList.add('theme-dark');
    if (theme === 'eco') root.classList.add('theme-eco');
  }, [theme]);

  if (!open) return null;

  return (
    <div className="overlay" role="dialog" aria-label="Settings">
      <div className="panel" style={{ width: 360 }}>
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Volume: {(volume * 100) | 0}%</span>
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => dispatch(setVolume(Number(e.currentTarget.value)))}
            />
          </label>
          <fieldset style={{ display: 'grid', gap: 8, border: '1px solid rgba(255,255,255,0.08)', padding: 10, borderRadius: 8 }}>
            <legend>Gameplay</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Campaign (10 Levels)" checked={campaign} onChange={(e) => dispatch(setCampaign(e.currentTarget.checked))} />
              <span>Campaign (10 Levels)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Time Attack" checked={timeAttack} onChange={(e) => dispatch(setTimeAttack(e.currentTarget.checked))} />
              <span>Time Attack (medals)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Multiball" checked={multiball} onChange={(e) => dispatch(setMultiball(e.currentTarget.checked))} />
              <span>Multiball</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Strong Bricks (HP 2-3)" checked={strongBricks} onChange={(e) => dispatch(setStrongBricks(e.currentTarget.checked))} />
              <span>Strong Bricks (HP 2-3)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Moving Bricks" checked={movingBricks} onChange={(e) => dispatch(setMovingBricks(e.currentTarget.checked))} />
              <span>Moving Bricks</span>
            </label>
          </fieldset>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Paddle Sensitivity: {paddleSensitivity.toFixed(2)}x</span>
            <input
              aria-label="Paddle Sensitivity"
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={paddleSensitivity}
              onChange={(e) => dispatch(setPaddleSensitivity(Number(e.currentTarget.value)))}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Theme</span>
            <select aria-label="Theme" value={theme} onChange={(e) => dispatch(setTheme(e.currentTarget.value as any))}>
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="eco">Eco</option>
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <button className="btn" onClick={() => dispatch(closeSettings())}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
