/* ======================================================
   Modal de Importação e Exportação
   ====================================================== */

import React, { useRef, useState } from 'react';
import {
    FileUp,
    Download,
    X,
    CheckCircle,
    AlertCircle,
    Copy,
    Save,
} from 'lucide-react';
import { importFromFile, type ImportResult } from '@/services/importService';
import { downloadAllPrompts, getTemplateFile } from '@/utils/exportJson';
import { toast } from 'react-hot-toast';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportExportModal({
    isOpen,
    onClose,
}: ImportExportModalProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setResult(null);

        try {
            const res = await importFromFile(file);
            setResult(res);
            if (res.success) {
                toast.success(`${res.count} prompts importados!`);
            } else {
                toast.error('Importação concluída com erros.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao importar');
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDownloadTemplate = () => {
        const blob = getTemplateFile();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompt-template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content modal-content--large"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="modal-title"
                aria-modal="true"
            >
                <div className="modal-header">
                    <h2 id="modal-title">Dados e Backup</h2>
                    <button
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Importar */}
                    <div className="form-section">
                        <h3 className="section-title">Importar</h3>
                        <p className="section-desc">
                            Selecione um arquivo <strong>.json</strong> exportado pelo Prompt App ou no formato padrão.
                        </p>

                        <label className="dropzone" id="import-dropzone">
                            <FileUp size={32} color="var(--color-text-muted)" aria-hidden="true" />
                            <span className="dropzone__label">
                                {importing ? 'Importando...' : 'Clique ou arraste um arquivo .json'}
                            </span>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden-input"
                                aria-labelledby="import-dropzone"
                            />
                        </label>

                        {result && (
                            <div
                                className={`import-result ${result.success ? 'import-result--success' : 'import-result--warning'}`}
                                aria-live="polite"
                            >
                                {result.success ? (
                                    <div className="import-result__header" role="status">
                                        <CheckCircle size={16} aria-hidden="true" />
                                        Importação concluída com sucesso!
                                    </div>
                                ) : (
                                    <div className="import-result__header" role="alert">
                                        <AlertCircle size={16} aria-hidden="true" />
                                        Importação concluída com {result.errors.length} erro(s)
                                    </div>
                                )}

                                <div className="import-result__stats">
                                    <div>✓ {result.count} prompts importados</div>
                                    <div>⏱ Tempo: {(result.processingTime / 1000).toFixed(2)}s</div>
                                    {result.warnings.length > 0 && (
                                        <div>⚠ {result.warnings.length} aviso(s)</div>
                                    )}
                                    {result.errors.length > 0 && (
                                        <div>✗ {result.errors.length} erro(s)</div>
                                    )}
                                </div>

                                {result.errors.length > 0 && (
                                    <div className="import-result__errors">
                                        <strong>Erros encontrados:</strong>
                                        <ul>
                                            {result.errors.slice(0, 3).map((error, idx) => (
                                                <li key={idx}>
                                                    <strong>{error.field}:</strong> {error.message}
                                                </li>
                                            ))}
                                            {result.errors.length > 3 && (
                                                <li>+ {result.errors.length - 3} outros erros...</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Exportar */}
                    <div className="form-section form-section--flush">
                        <h3 className="section-title">Exportar</h3>
                        <div className="action-grid">
                            <button
                                className="action-card"
                                onClick={() => downloadAllPrompts()}
                            >
                                <Download size={24} color="var(--blue-primary)" />
                                <div className="action-card__info">
                                    <strong>Exportar Tudo</strong>
                                    <span>Backup completo de todos os prompts</span>
                                </div>
                            </button>

                            <button
                                className="action-card"
                                onClick={handleDownloadTemplate}
                            >
                                <Save size={24} color="var(--blue-accent)" />
                                <div className="action-card__info">
                                    <strong>Baixar Template</strong>
                                    <span>Modelo para criar novos prompts</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Dicas */}
                    <div className="info-box">
                        <Copy size={18} />
                        <div>
                            <strong>Dica:</strong> Você também pode importar prompts copiando o JSON
                            e colando diretamente no editor.
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn--secondary" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
