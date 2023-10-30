import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import BX24 from './btx-api';

const container = document.getElementById('root');
const root = createRoot(container);

window.addEventListener('load', () => {
  BX24.init().then(() => {
    BX24.placement.info().then((r) => {
      BX24.getAuth().then((auth) => {
        root.render(
          <App />
        )
      })
    });
  }).catch(() =>
    root.render(
      <React.StrictMode>
        <h1>Ошибка инициализации битрикс 24</h1>
      </React.StrictMode>
    )
  );
});