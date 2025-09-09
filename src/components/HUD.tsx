import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import { pause, resume, toggleMute } from '../state/slices/gameSlice';
import { thresholdsForLevel } from '../engine/utils';
import { toggleSettings } from '../state/slices/settingsSlice';
import { sfx } from '../audio/sfx';

const HUD: React.FC = () => {
  const score = useSelector((s: RootState) => s.score.score);
  const high = useSelector((s: RootState) => s.score.highScore);
  const lives = useSelector((s: RootState) => s.game.lives);
  const level = useSelector((s: RootState) => s.level.current) + 1;
  const muted = useSelector((s: RootState) => s.game.muted);
  const timeAttack = useSelector((s: RootState) => s.settings.timeAttack);
  const dispatch = useDispatch();
  const status = useSelector((s: RootState) => s.game.status);
  const [elapsed, setElapsed] = useState<number>(0);
  const [medalNow, setMedalNow] = useState<'gold'|'silver'|'bronze'|'none'>('none');
  const rafRef = useRef<number | null>(null);
  const earned = useSelector((s: RootState) => s.level.earned || []);
  const lvlIndex = useSelector((s: RootState) => s.level.current);

  useEffect(() => {
    if (!timeAttack) { setElapsed(0); setMedalNow('none'); return; }
    let last = 0;
    const tick = (t: number) => {
      // Throttle to ~10Hz updates
      if (t - last > 80) {
        const canvas = document.querySelector('canvas.game-canvas');
        if (canvas) {
          const e = Number((canvas as HTMLElement).getAttribute('data-elapsed') || '0');
          const m = ((canvas as HTMLElement).getAttribute('data-medal-now') || 'none') as any;
          if (!Number.isNaN(e)) setElapsed(e);
          setMedalNow(m);
        }
        last = t;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [timeAttack]);
  const medalColor = medalNow === 'gold' ? '#ffd54f' : medalNow === 'silver' ? '#cfd8dc' : medalNow === 'bronze' ? '#ffb74d' : '#9e9e9e';
  const medalLabel = medalNow[0]?.toUpperCase() + medalNow.slice(1);
  const thr = thresholdsForLevel(lvlIndex);

  return (
    <div className="hud">
      <div className="tile" style={{ display: 'flex', gap: 10 }}>
        <span><strong>Score:</strong> {score}</span>
        <span><strong>Lives:</strong> {lives}</span>
        <span><strong>Level:</strong> {level}</span>
        <span><strong>High:</strong> {high}</span>
      </div>
      {timeAttack && (
        <div className="tile" aria-label="Time Attack" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span><strong>Time:</strong> {elapsed.toFixed(1)}s</span>
          <span className="badge" style={{ background: medalColor, color: '#0b1020', padding: '2px 8px', borderRadius: 999 }}>
            {medalLabel}
          </span>
          <span style={{ opacity: 0.85, fontSize: 12 }}>
            ≤{thr.gold}s Gold · ≤{thr.silver}s Silver · ≤{thr.bronze}s Bronze
          </span>
        </div>
      )}
      {!!earned.length && (
        <div className="tile" aria-label="Earned Medals" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {earned.map((m, i) => (
            <span key={i} title={m}
              style={{
                display: 'inline-block',
                width: 14, height: 14,
                borderRadius: 999,
                background: m === 'gold' ? '#ffd54f' : m === 'silver' ? '#cfd8dc' : '#ffb74d',
                boxShadow: '0 0 6px rgba(0,0,0,0.25)'
              }}
            />
          ))}
        </div>
      )}
      <div className="tile" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn" onClick={() => { sfx.play('click'); dispatch(toggleMute()); }}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button className="btn" onClick={() => { sfx.play('click'); dispatch(toggleSettings()); }}>
          Settings
        </button>
        {status === 'playing' ? (
          <button className="btn" onClick={() => { sfx.play('click'); dispatch(pause()); }}>
            Pause
          </button>
        ) : status === 'paused' ? (
          <button className="btn" onClick={() => { sfx.play('click'); dispatch(resume()); }}>
            Resume
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default HUD;
