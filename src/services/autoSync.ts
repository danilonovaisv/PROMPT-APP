import { db } from '@/db/database';
import { syncToCloud } from './syncService';

let timer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 10000; // 10 segundos para não floodar o Supabase

function scheduleSync() {
    if (timer) clearTimeout(timer);
    // Só agendar se tiver online (simples checagem)
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    console.log('⏳ Auto-sync agendado para 10s...');
    timer = setTimeout(() => {
        console.log('🚀 Executando Auto-sync (Push)...');
        syncToCloud().catch(err => console.error('Erro no auto-sync:', err));
    }, DEBOUNCE_MS);
}

export function setupAutoSync() {
    // Hooks para Prompts
    db.prompts.hook('creating', () => { scheduleSync(); });
    db.prompts.hook('updating', () => { scheduleSync(); });
    db.prompts.hook('deleting', () => { scheduleSync(); });

    // Hooks para Categorias
    db.categories.hook('creating', () => { scheduleSync(); });
    db.categories.hook('updating', () => { scheduleSync(); });
    db.categories.hook('deleting', () => { scheduleSync(); });

    // Hooks para Menus
    db.contextMenus.hook('creating', () => { scheduleSync(); });
    db.contextMenus.hook('updating', () => { scheduleSync(); });
    db.contextMenus.hook('deleting', () => { scheduleSync(); });

    console.log('✅ Auto-sync hooks instalados.');
}
