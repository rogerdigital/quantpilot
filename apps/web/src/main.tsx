import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.tsx';
import './app/styles/theme.css.ts';
import './app/styles/animations.css.ts';
import './app/styles/base.css.ts';
import './app/styles/layout.css.ts';
import './app/styles/panels.css.ts';
import './app/styles/chips.css.ts';
import './app/styles/tables.css.ts';
import './app/styles/settings.css.ts';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
