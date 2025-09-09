export type Medal = 'gold' | 'silver' | 'bronze' | 'none';

// Thresholds grow with level difficulty (0-based level index)
export function thresholdsForLevel(levelIndex: number) {
  const li = Math.max(0, levelIndex | 0);
  const gold = 45 + li * 3;
  const silver = 75 + li * 5;
  const bronze = 120 + li * 8;
  return { gold, silver, bronze };
}

export function computeMedalForLevel(timeSec: number, levelIndex: number): Medal {
  const { gold, silver, bronze } = thresholdsForLevel(levelIndex);
  if (timeSec <= gold) return 'gold';
  if (timeSec <= silver) return 'silver';
  if (timeSec <= bronze) return 'bronze';
  return 'none';
}

export function medalBonus(m: Medal): number {
  if (m === 'gold') return 300;
  if (m === 'silver') return 200;
  if (m === 'bronze') return 100;
  return 0;
}

export function comboBonus(count: number): number {
  // 0 for first hit, +20 per extra hit
  if (count <= 1) return 0;
  return (count - 1) * 20;
}

