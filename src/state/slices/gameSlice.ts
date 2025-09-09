import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GameStatus = 'menu' | 'playing' | 'paused' | 'levelCleared' | 'gameOver';

export interface GameState {
  status: GameStatus;
  lives: number;
  muted: boolean;
}

const INITIAL_LIVES = 3;

const initialState: GameState = {
  status: 'menu',
  lives: INITIAL_LIVES,
  muted: false
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame(state) {
      state.status = 'playing';
      state.lives = INITIAL_LIVES;
    },
    pause(state) {
      if (state.status === 'playing') state.status = 'paused';
    },
    resume(state) {
      if (state.status === 'paused') state.status = 'playing';
    },
    levelCleared(state) {
      state.status = 'levelCleared';
    },
    gameOver(state) {
      state.status = 'gameOver';
    },
    loseLife(state) {
      if (state.lives > 0) state.lives -= 1;
      if (state.lives <= 0) {
        state.lives = 0;
        state.status = 'gameOver';
      }
    },
    toggleMute(state, action: PayloadAction<boolean | undefined>) {
      state.muted = action.payload ?? !state.muted;
    }
  }
});

export const { startGame, pause, resume, levelCleared, gameOver, loseLife, toggleMute } = gameSlice.actions;
export default gameSlice.reducer;

