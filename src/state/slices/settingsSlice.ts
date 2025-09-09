import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'auto' | 'light' | 'dark' | 'eco';

export interface SettingsState {
  volume: number; // 0..1
  theme: Theme;
  paddleSensitivity: number; // 0.5..2.0
  campaign: boolean;
  timeAttack: boolean;
  multiball: boolean;
  strongBricks: boolean;
  movingBricks: boolean;
  open?: boolean;
}

const initialState: SettingsState = {
  volume: 1,
  theme: 'auto',
  paddleSensitivity: 1,
  campaign: true,
  timeAttack: true,
  multiball: true,
  strongBricks: true,
  movingBricks: true,
  open: false
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setVolume(state, action: PayloadAction<number>) {
      state.volume = Math.min(1, Math.max(0, action.payload));
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setPaddleSensitivity(state, action: PayloadAction<number>) {
      const v = action.payload;
      state.paddleSensitivity = Math.max(0.5, Math.min(2.0, v));
    },
    setCampaign(state, action: PayloadAction<boolean>) { state.campaign = !!action.payload; },
    setTimeAttack(state, action: PayloadAction<boolean>) { state.timeAttack = !!action.payload; },
    setMultiball(state, action: PayloadAction<boolean>) { state.multiball = !!action.payload; },
    setStrongBricks(state, action: PayloadAction<boolean>) { state.strongBricks = !!action.payload; },
    setMovingBricks(state, action: PayloadAction<boolean>) { state.movingBricks = !!action.payload; },
    openSettings(state) { state.open = true; },
    closeSettings(state) { state.open = false; },
    toggleSettings(state) { state.open = !state.open; }
  }
});

export const { setVolume, setTheme, setPaddleSensitivity, setCampaign, setTimeAttack, setMultiball, setStrongBricks, setMovingBricks, openSettings, closeSettings, toggleSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
