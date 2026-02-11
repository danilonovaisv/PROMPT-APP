/* ======================================================
   Modal de Importação / Exportação
   ====================================================== */

import { useState, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { downloadAllPrompts } from '@/utils/exportJson';
import { importFromFile } from '@/utils/importJson';
import {
    X,
    Upload,
    Download,
    FileUp,
    CheckCircle,
    AlertCircle,
    History,
    RefreshCw,
} from 'lucide-react';
import { getLocalBackupInfo, restoreFromSnapshot } from '@/utils/backupManager';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ count: number; error?: string } | null>(null);

    if (!isOpen) return null;

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            showToast('Apenas arquivos .json são aceitos', 'error');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const count = await importFromFile(file);
            setResult({ count });
            showToast(`${count} prompt(s) importado(s) com sucesso!`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setResult({ count: 0, error: msg });
            showToast('Erro na importação: ' + msg, 'error');
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleExport = async () => {
        await downloadAllPrompts();
        showToast('Exportação concluída!');
    };

    const handleRestoreLocal = async () => {
        const raw = localStorage.getItem('prompt_app_global_backup');
        if (!raw) return;

        if (!confirm('ATENÇÃO: Restaurar o backup local irá substituir todos os dados atuais. Deseja continuar?')) {
            return;
        }

        try {
            const snapshot = JSON.parse(raw);
            const ok = await restoreFromSnapshot(snapshot);
            if (ok) {
                showToast('Banco de dados restaurado com sucesso!');
                window.location.reload(); // Recarregar para atualizar todos os hooks
            }
        } catch (e) {
            showToast('Erro ao restaurar backup', 'error');
        }
    };

    const backupInfo = getLocalBackupInfo();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h2>Importar / Exportar</h2>
                    <button
                        className="btn btn--ghost btn--icon"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal__body">
                    {/* Importar */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Upload size={18} /> Importar Prompts
                        </h3>
                        <p className="import-description">
                            Selecione um arquivo <strong>.json</strong> exportado pelo Prompt App ou no formato padrão.
                        </p>

                        <label className="dropzone">
                            <FileUp size={32} color="var(--color-text-muted)" />
                            <span className="dropzone__label">
                                {importing ? 'Importando...' : 'Clique ou arraste um arquivo .json'}
                            </span>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden-input"
                            />
                        </label>

                        {result && (
                            <div className={`import-result ${result.error ? 'import-result--error' : 'import-result--success'}`}>
                                {result.error ? (
                                    <>
                                        <AlertCircle size={16} />
                                        Erro: {result.error}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        {result.count} prompt(s) importado(s) com sucesso!
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Exportar */}
                    <div className="form-section form-section--flush">
                        <h3 className="form-section__title">
                            <Download size={18} /> Exportar Todos os Prompts
                        </h3>
                        <p className="import-description">
                            Baixe todos os seus prompts organizados por categoria em um único arquivo <strong>.json</strong>.
                        </p>
                        <button className="btn btn--primary btn--lg" onClick={handleExport}>
                            <Download size={18} /> Exportar Tudo (.json)
                        </button>
                    </div>

                    {/* Backup Local */}
                    <div className="form-section form-section--flush">
                        <h3 className="form-section__title">
                            <History size={18} /> Backup de Segurança
                        </h3>
                        <p className="import-description">
                            O sistema mantém uma cópia automática das suas informações para casos de emergência.
                        </p>

                        {backupInfo ? (
                            <div className="backup-status">
                                <div className="backup-status__info">
                                    <div className="backup-status__date">
                                        Último backup: <strong>{new Date(backupInfo.timestamp).toLocaleString('pt-BR')}</strong>
                                    </div>
                                    <div className="backup-status__details">
                                        {backupInfo.count.prompts} prompts • {backupInfo.count.categories} categorias
                                    </div>
                                </div>
                                <button className="btn btn--secondary btn--sm" onClick={handleRestoreLocal}>
                                    <RefreshCw size={14} /> Restaurar Cópia
                                </button>
                            </div>
                        ) : (
                            <p className="ctx-empty-hint">Nenhum backup automático disponível ainda.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
