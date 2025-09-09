import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../state/store';
import HUD from '../HUD';
import { vi } from 'vitest';

describe('HUD timer UI', () => {
  beforeEach(() => {
    // Ensure a canvas exists for HUD polling
    let canvas = document.querySelector('canvas.game-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'game-canvas';
      document.body.appendChild(canvas);
    }
    (canvas as HTMLElement).setAttribute('data-medal-now', 'none');
  });

  it('reads and displays elapsed time updates', async () => {
    vi.useFakeTimers();
    let t = 0;
    const timers: any[] = [];
    const raf: any = vi.spyOn(window as any, 'requestAnimationFrame' as any);
    raf.mockImplementation((cb: FrameRequestCallback) => {
      t += 100; // ms
      const id: any = setTimeout(() => cb(t), 0);
      timers.push(id);
      return id as any;
    });
    const caf: any = vi.spyOn(window as any, 'cancelAnimationFrame' as any);
    caf.mockImplementation((id: any) => clearTimeout(id));

    const canvas = document.querySelector('canvas.game-canvas') as HTMLElement;
    canvas.setAttribute('data-elapsed', '0.1');

    render(
      <Provider store={store}>
        <HUD />
      </Provider>
    );

    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByLabelText('Time Attack')).toHaveTextContent(/Time:\s*0\.1s/);

    canvas.setAttribute('data-elapsed', '0.7');
    await vi.runOnlyPendingTimersAsync();
    expect(screen.getByLabelText('Time Attack')).toHaveTextContent(/Time:\s*0\.7s/);

    raf.mockRestore();
    caf.mockRestore();
    vi.useRealTimers();
  });
});
