import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../state/store';
import HUD from '../HUD';

describe('HUD', () => {
  it('renders initial values', () => {
    render(
      <Provider store={store}>
        <HUD />
      </Provider>
    );
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Lives:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByText(/High:/)).toBeInTheDocument();
  });
});

