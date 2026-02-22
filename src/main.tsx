/* ======================================================
   main.tsx — Entry point
   ====================================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/* Inicializar DB (imported side-effect) */
import '@/db/database';

document.documentElement.classList.add('js');

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
