import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import game from './state/slices/gameSlice';
import score from './state/slices/scoreSlice';
import level from './state/slices/levelSlice';
import settings from './state/slices/settingsSlice';
import App from './App';

// Mock GameCanvas to avoid requiring a real CanvasRenderingContext2D in JSDOM
vi.mock('./components/GameCanvas', () => ({
  default: () => <div data-testid="canvas-mock" />
}));

describe('App integration', () => {
  it('starts from menu and transitions to playing', () => {
    const localStore = configureStore({ reducer: { game, score, level, settings } });
    render(
      <Provider store={localStore}>
        <App />
      </Provider>
    );
    expect(screen.getByText('Arkanoid — Modern MVP')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start'));
    // Menu overlay should disappear
    expect(screen.queryByText('Arkanoid — Modern MVP')).toBeNull();
    // HUD should still be visible
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
  });

  it('can pause and resume using HUD controls', () => {
    const localStore = configureStore({ reducer: { game, score, level, settings } });
    render(
      <Provider store={localStore}>
        <App />
      </Provider>
    );
    // Start first
    fireEvent.click(screen.getByText('Start'));
    // Pause
    fireEvent.click(screen.getByText('Pause'));
    expect(screen.getByText('Paused')).toBeInTheDocument();
    // Resume from overlay (choose the first matching button)
    const resumes = screen.getAllByText('Resume');
    fireEvent.click(resumes[0]);
    expect(screen.queryByText('Paused')).toBeNull();
  });
});
