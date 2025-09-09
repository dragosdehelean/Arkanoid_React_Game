import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Medal } from '../../engine/utils';

export interface LevelState {
  current: number; // 0-based
  total: number;
  lastTimeSec?: number;
  lastMedal?: 'gold' | 'silver' | 'bronze' | 'none';
  earned?: Medal[];
}

const initialState: LevelState = {
  current: 0,
  total: 3,
  earned: []
};

const levelSlice = createSlice({
  name: 'level',
  initialState,
  reducers: {
    loadLevel(state, action: PayloadAction<number>) {
      const i = action.payload | 0;
      if (i >= 0 && i < state.total) state.current = i;
    },
    nextLevel(state) {
      if (state.current + 1 < state.total) state.current += 1;
    },
    setTotal(state, action: PayloadAction<number>) {
      const t = Math.max(1, action.payload | 0);
      state.total = t;
      if (state.current >= t) state.current = t - 1;
    },
    setLastTime(state, action: PayloadAction<{ timeSec: number; medal: 'gold'|'silver'|'bronze'|'none' }>) {
      state.lastTimeSec = action.payload.timeSec;
      state.lastMedal = action.payload.medal;
    },
    addMedal(state, action: PayloadAction<Medal>) {
      (state.earned ||= []).push(action.payload);
    },
    clearMedals(state) { state.earned = []; }
  }
});

export const { loadLevel, nextLevel, setTotal, setLastTime, addMedal, clearMedals } = levelSlice.actions;
export default levelSlice.reducer;
