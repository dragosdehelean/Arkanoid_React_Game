import reducer, { startGame, pause, resume, loseLife } from '../gameSlice';

describe('gameSlice', () => {
  it('starts game with initial lives', () => {
    const s = reducer(undefined, startGame());
    expect(s.status).toBe('playing');
    expect(s.lives).toBeGreaterThan(0);
  });

  it('pauses and resumes only from correct states', () => {
    let s = reducer(undefined, startGame());
    s = reducer(s, pause());
    expect(s.status).toBe('paused');
    s = reducer(s, resume());
    expect(s.status).toBe('playing');
  });

  it('loseLife reduces lives and triggers gameOver at 0', () => {
    let s = reducer(undefined, startGame());
    s = reducer(s, loseLife());
    s = reducer(s, loseLife());
    s = reducer(s, loseLife());
    expect(s.lives).toBe(0);
    expect(s.status).toBe('gameOver');
    // extra calls keep at 0 and gameOver
    s = reducer(s, loseLife());
    expect(s.lives).toBe(0);
    expect(s.status).toBe('gameOver');
  });
});

