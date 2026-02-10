/* ======================================================
   main.tsx — Entry point
   ====================================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/* Inicializar DB (imported side-effect) */
import './db/database';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
