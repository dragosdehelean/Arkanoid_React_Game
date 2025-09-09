import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadHighScore } from '../persistence';

export interface ScoreState {
  score: number;
  highScore: number;
}

const initialState: ScoreState = {
  score: 0,
  highScore: loadHighScore()
};

const scoreSlice = createSlice({
  name: 'score',
  initialState,
  reducers: {
    addScore(state, action: PayloadAction<number>) {
      state.score += Math.max(0, Math.floor(action.payload));
    },
    resetScore(state) {
      state.score = 0;
    },
    commitHighScore(state) {
      if (state.score > state.highScore) state.highScore = state.score;
    }
  }
});

export const { addScore, resetScore, commitHighScore } = scoreSlice.actions;
export default scoreSlice.reducer;

