import reducer, { addScore, resetScore, commitHighScore } from '../scoreSlice';

describe('scoreSlice', () => {
  it('adds score and resets', () => {
    let s = reducer(undefined, addScore(100));
    s = reducer(s, addScore(50));
    expect(s.score).toBe(150);
    s = reducer(s, resetScore());
    expect(s.score).toBe(0);
  });

  it('commits high score when larger', () => {
    let s = reducer(undefined, resetScore());
    s = reducer(s, addScore(200));
    s = reducer(s, commitHighScore());
    expect(s.highScore).toBeGreaterThanOrEqual(200);
  });
});

