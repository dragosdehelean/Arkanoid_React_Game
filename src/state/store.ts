import { configureStore } from '@reduxjs/toolkit';
import game from './slices/gameSlice';
import score from './slices/scoreSlice';
import level from './slices/levelSlice';
import settings from './slices/settingsSlice';
import { saveHighScore } from './persistence';

export const store = configureStore({
  reducer: { game, score, level, settings }
});

// Persist high score on changes (simple subscription; lightweight)
let lastHigh = store.getState().score.highScore;
store.subscribe(() => {
  const nextHigh = store.getState().score.highScore;
  if (nextHigh !== lastHigh) {
    lastHigh = nextHigh;
    saveHighScore(nextHigh);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

