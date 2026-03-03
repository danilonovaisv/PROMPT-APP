/**
 * Inicializa os listeners de realtime do Supabase
 */
export declare function setupRealtimeListeners(): Promise<void>;
/**
 * Remove todos os listeners de realtime
 */
export declare function cleanupRealtimeListeners(): void;
/**
 * Reativa os listeners após reconexão
 */
export declare function reconnectRealtime(): Promise<void>;
