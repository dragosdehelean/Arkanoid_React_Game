import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../store';
import { addScore, commitHighScore, resetScore } from '../slices/scoreSlice';

describe('high score persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves high score to localStorage on change', () => {
    store.dispatch(resetScore());
    store.dispatch(addScore(123));
    store.dispatch(commitHighScore());
    const saved = Number(localStorage.getItem('arkanoid:highScore'));
    expect(saved).toBeGreaterThanOrEqual(123);
  });
});

