import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './state/store';
import App from './App';
import './styles/theme.css';
import { initAudio } from './audio/sfx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Initialize audio after render
initAudio(store);

// Mark DOM as ready for E2E detection
if (typeof document !== 'undefined') {
  document.body.setAttribute('data-app-ready', '1');
}
