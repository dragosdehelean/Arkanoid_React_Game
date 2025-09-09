import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import game from '../../state/slices/gameSlice';
import score from '../../state/slices/scoreSlice';
import level from '../../state/slices/levelSlice';
import settings from '../../state/slices/settingsSlice';
import App from '../../App';

// Mock GameCanvas to avoid Canvas in JSDOM
vi.mock('../../components/GameCanvas', () => ({
  default: () => <div data-testid="canvas-mock" />
}));

describe('Theme switching', () => {
  it('applies theme-eco class on root when selecting Eco', () => {
    const localStore = configureStore({ reducer: { game, score, level, settings } });
    render(
      <Provider store={localStore}>
        <App />
      </Provider>
    );

    // Open Settings (menu or HUD button)
    fireEvent.click(screen.getAllByText('Settings')[0]);
    const select = screen.getByLabelText('Theme') as HTMLSelectElement;
    // Change to Eco
    fireEvent.change(select, { target: { value: 'eco' } });

    expect(document.documentElement.classList.contains('theme-eco')).toBe(true);

    // Change back to Light
    fireEvent.change(select, { target: { value: 'light' } });
    expect(document.documentElement.classList.contains('theme-eco')).toBe(false);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });
});
