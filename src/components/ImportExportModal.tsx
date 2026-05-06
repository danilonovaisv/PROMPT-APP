/* ======================================================
   Modal de Importação e Exportação
   ====================================================== */

import React, { useEffect, useRef, useState, startTransition } from 'react';
import {
    FileUp,
    Download,
    X,
    CheckCircle,
    AlertCircle,
    Copy,
    Save,
} from 'lucide-react';
import { importFromFile, importFromJsonText, type ImportResult } from '@/services/importService';
import { useToast } from '@/context/ToastContext';
import { useAccessibleModal } from '@/hooks/useAccessibleModal';
import { downloadAllPrompts, getTemplateFile } from '@/utils/exportJson';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportExportModal({
    isOpen,
    onClose,
}: ImportExportModalProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const { showToast } = useToast();
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [jsonInput, setJsonInput] = useState('');

    useAccessibleModal({
        isOpen,
        onClose,
        containerRef: modalRef,
        initialFocusRef: closeButtonRef,
    });

    useEffect(() => {
        if (!isOpen) {
            startTransition(() => {
                setResult(null);
                setJsonInput('');
            });
        }
    }, [isOpen]);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name || 'unknown.json';
        const isJson = (file.type === 'application/json') || fileName.toLowerCase().endsWith('.json');

        if (!isJson) {
            showToast('Por favor, selecione um arquivo .json válido.', 'error');
            if (fileRef.current) fileRef.current.value = '';
            return;
        }


        setImporting(true);
        setResult(null);

        try {
            const res = await importFromFile(file);
            setResult(res);
            if (res.success) {
                showToast(`${res.count} prompts importados!`, 'success');
            } else {
                showToast('Importação concluída com erros.', 'error');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Erro ao importar';
            showToast(errorMessage, 'error');
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleImportFromText = async () => {
        const trimmedInput = jsonInput.trim();
        if (!trimmedInput) {
            showToast('Cole um JSON válido para importar.', 'error');
            return;
        }

        if (!trimmedInput.startsWith('{') && !trimmedInput.startsWith('[')) {
            showToast('O texto não parece iniciar com formato JSON válido ({ ou [).', 'error');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const res = await importFromJsonText(jsonInput, 'clipboard.json');
            setResult(res);
            if (res.success) {
                showToast(`${res.count} prompts importados!`, 'success');
                setJsonInput('');
            } else {
                showToast('Importação concluída com erros.', 'error');
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Erro ao importar JSON colado';
            showToast(errorMessage, 'error');
        } finally {
            setImporting(false);
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
                ref={modalRef}
                className="modal-content modal-content--large"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="modal-title"
                aria-modal="true"
                aria-describedby="modal-description"
                tabIndex={-1}
            >
                <div className="modal-header">
                    <h2 id="modal-title">Dados e Backup</h2>
                    <button
                        ref={closeButtonRef}
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Importar */}
                    <fieldset className="form-section">
                        <legend className="section-title">Importar</legend>
                        <p className="section-desc" id="modal-description">
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

                        <div className="form-group">
                            <label className="form-label" htmlFor="json-import-input">
                                Ou cole o JSON diretamente
                            </label>
                            <textarea
                                id="json-import-input"
                                value={jsonInput}
                                onChange={(event) => setJsonInput(event.target.value)}
                                rows={8}
                                placeholder="Cole aqui um prompt exportado ou um backup em JSON"
                                aria-required="true"
                            />
                        </div>

                        <button
                            className="btn btn--secondary"
                            onClick={handleImportFromText}
                            disabled={importing}
                        >
                            <Copy size={16} aria-hidden="true" /> Importar JSON colado
                        </button>

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

                                {result.warnings.length > 0 && (
                                    <div className="import-result__errors">
                                        <strong>Avisos de compatibilidade:</strong>
                                        <ul>
                                            {result.warnings.slice(0, 3).map((warning, idx) => (
                                                <li key={idx}>{warning}</li>
                                            ))}
                                            {result.warnings.length > 3 && (
                                                <li>+ {result.warnings.length - 3} outros avisos...</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

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
                    </fieldset>

                    {/* Exportar */}
                    <fieldset className="form-section form-section--flush">
                        <legend className="section-title">Exportar</legend>
                        <div className="action-grid">
                            <button
                                className="action-card"
                                onClick={() => downloadAllPrompts()}
                                aria-label="Exportar todos os prompts como backup completo"
                            >
                                <Download size={24} color="var(--blue-primary)" aria-hidden="true" />
                                <div className="action-card__info">
                                    <strong>Exportar Tudo</strong>
                                    <span>Backup completo de todos os prompts</span>
                                </div>
                            </button>

                            <button
                                className="action-card"
                                onClick={handleDownloadTemplate}
                                aria-label="Baixar template padrão para criação de novos prompts"
                            >
                                <Save size={24} color="var(--blue-accent)" aria-hidden="true" />
                                <div className="action-card__info">
                                    <strong>Baixar Template</strong>
                                    <span>Modelo para criar novos prompts</span>
                                </div>
                            </button>
                        </div>
                    </fieldset>

                    {/* Dicas */}
                    <div className="info-box">
                        <Copy size={18} aria-hidden="true" />
                        <div>
                            <strong>Dica:</strong> O JSON técnico continua disponível para backup;
                            a ação primária de uso do produto deve ser copiar o prompt final no editor.
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
