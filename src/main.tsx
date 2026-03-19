/* ======================================================
   main.tsx — Entry point
   ====================================================== */

import './instrument';
import { reactErrorHandler } from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/* Inicializar DB (imported side-effect) */
import '@/db/database';




document.documentElement.classList.add('js');

createRoot(document.getElementById('root')!, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
    <StrictMode>
        <App />
    </StrictMode>
);
