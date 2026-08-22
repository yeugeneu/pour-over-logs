import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { CoffeeProvider } from './context/CoffeeContext';
import { I18nProvider } from './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <CoffeeProvider>
        <App />
      </CoffeeProvider>
    </I18nProvider>
  </React.StrictMode>
);
