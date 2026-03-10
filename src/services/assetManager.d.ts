export interface AssetUpdate {
    type: 'category' | 'prompt' | 'menu';
    id: number;
    remoteId?: number;
    action: 'created' | 'updated' | 'deleted';
    timestamp: Date;
    data?: any;
}
export interface ConflictResolution {
    strategy: 'localWins' | 'remoteWins' | 'merge' | 'askUser';
    timestamp: Date;
    resolved: boolean;
}
/**
 * Detecta conflitos entre dados locais e remotos
 */
export declare function detectConflicts(): Promise<AssetUpdate[]>;
/**
 * Resolve conflitos de acordo com a estratégia escolhida
 */
export declare function resolveConflicts(conflicts: AssetUpdate[], strategy?: ConflictResolution['strategy']): Promise<void>;
/**
 * Sincronização inteligente bidirecional
 */
export declare function smartSync(): Promise<{
    pulled: number;
    pushed: number;
    conflicts: number;
}>;
/**
 * Verifica se há atualizações disponíveis
 */
export declare function checkForUpdates(): Promise<boolean>;
/**
 * Monitora mudanças em tempo real e atualiza assets automaticamente
 */
export declare function setupAssetMonitoring(): void;
