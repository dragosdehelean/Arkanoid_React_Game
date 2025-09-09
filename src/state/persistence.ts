export function loadHighScore(): number {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return 0;
    const raw = window.localStorage.getItem('arkanoid:highScore');
    return raw ? Math.max(0, Number(raw) || 0) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(v: number) {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return;
    window.localStorage.setItem('arkanoid:highScore', String(Math.max(0, Math.floor(v))));
  } catch {
    // ignore persistence errors
  }
}

