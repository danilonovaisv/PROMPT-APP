/* ======================================================
   Modal de Importação de Menus de Contexto via JSON
   Preview + Validação + Feedback explícito
   ====================================================== */

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import {
    importMenusFromFile,
    validateMenuImportFile,
    checkMenuIdConflicts,
} from '@/utils/importMenusJson';
import type {
    MenuImportSchema,
    ImportResult,
    ValidationError,
} from '@/utils/importMenusJson';
import {
    X,
    Upload,
    FileUp,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Eye,
    Layers,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

interface ImportMenusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalStep = 'upload' | 'preview' | 'result';

export default function ImportMenusModal({ isOpen, onClose }: ImportMenusModalProps) {
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<ModalStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<MenuImportSchema | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [expandedPreview, setExpandedPreview] = useState<Set<number>>(new Set());
    const [skipConflicts, setSkipConflicts] = useState(false);

    const reset = useCallback(() => {
        setStep('upload');
        setFile(null);
        setParsedData(null);
        setValidationErrors([]);
        setConflicts([]);
        setImportResult(null);
        setImporting(false);
        setExpandedPreview(new Set());
        setSkipConflicts(false);
        if (fileRef.current) fileRef.current.value = '';
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    /* === Upload + Validação === */
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.json')) {
            showToast('Apenas arquivos .json são aceitos', 'error');
            return;
        }

        setFile(selectedFile);
        setValidationErrors([]);
        setConflicts([]);

        try {
            const text = await selectedFile.text();
            const raw = JSON.parse(text);
            const result = validateMenuImportFile(raw);

            if (!result.valid || !result.data) {
                setValidationErrors(result.errors);
                setStep('upload');
                showToast('Arquivo inválido — verifique os erros abaixo', 'error');
                return;
            }

            /* Verificar conflitos */
            const menuIds = result.data.menus.map((m) => m.menu_id);
            const conflictedIds = await checkMenuIdConflicts(menuIds);
            setConflicts(conflictedIds);

            setParsedData(result.data);
            setStep('preview');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setValidationErrors([{ field: 'file', message: `JSON inválido: ${msg}` }]);
            showToast('JSON mal-formatado', 'error');
        }

        if (fileRef.current) fileRef.current.value = '';
    };

    /* === Confirmação de Importação === */
    const handleConfirmImport = async () => {
        if (!file) return;

        /* Re-read file for the import function */
        setImporting(true);
        try {
            const result = await importMenusFromFile(file, skipConflicts);
            setImportResult(result);
            setStep('result');

            if (result.success) {
                showToast(`${result.imported} menu(s) importado(s) com sucesso!`);
            } else {
                showToast('Falha na importação', 'error');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            setImportResult({
                success: false,
                imported: 0,
                errors: [{ field: 'system', message: msg }],
                conflicts: [],
                log: [`Erro fatal: ${msg}`],
            });
            setStep('result');
            showToast('Erro inesperado na importação', 'error');
        } finally {
            setImporting(false);
        }
    };

    const togglePreviewMenu = (idx: number) => {
        setExpandedPreview((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h2>
                        <Upload size={20} /> Importar Menus (JSON)
                    </h2>
                    <button
                        className="btn btn--ghost btn--icon"
                        onClick={handleClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal__body">
                    {/* === STEP: UPLOAD === */}
                    {step === 'upload' && (
                        <div className="form-section">
                            <h3 className="form-section__title">
                                <FileUp size={18} /> Selecionar Arquivo
                            </h3>
                            <p className="import-description">
                                Selecione um arquivo <strong>.json</strong> no formato de importação de menus.
                                O sistema validará o schema antes de importar.
                            </p>

                            <label className="dropzone">
                                <FileUp size={32} color="var(--color-text-muted)" />
                                <span className="dropzone__label">
                                    Clique ou arraste um arquivo .json
                                </span>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="hidden-input"
                                />
                            </label>

                            {/* Erros de validação */}
                            {validationErrors.length > 0 && (
                                <div className="import-result import-result--error">
                                    <div className="import-result__header">
                                        <AlertCircle size={16} />
                                        <strong>
                                            {validationErrors.length} erro(s) de validação
                                        </strong>
                                    </div>
                                    <ul className="import-errors-list">
                                        {validationErrors.map((err, i) => (
                                            <li key={i} className="import-errors-list__item">
                                                <code>{err.field}</code>: {err.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Schema reference */}
                            <details className="import-schema-ref">
                                <summary className="import-schema-ref__toggle">
                                    <Eye size={14} /> Ver schema esperado
                                </summary>
                                <pre className="json-preview json-preview--compact">{JSON.stringify({
                                    version: '1.0',
                                    menus: [{
                                        menu_id: 'string',
                                        menu_name: 'string',
                                        description: 'string',
                                        options: [{
                                            label: 'string',
                                            value: 'string',
                                            sub_options: [{ label: 'string', value: 'string' }],
                                        }],
                                    }],
                                }, null, 2)}</pre>
                            </details>
                        </div>
                    )}

                    {/* === STEP: PREVIEW === */}
                    {step === 'preview' && parsedData && (
                        <div className="form-section">
                            <h3 className="form-section__title">
                                <Eye size={18} /> Preview — {parsedData.menus.length} menu(s) encontrado(s)
                            </h3>

                            {/* Conflicts warning */}
                            {conflicts.length > 0 && (
                                <div className="import-result import-result--warning">
                                    <div className="import-result__header">
                                        <AlertTriangle size={16} />
                                        <strong>
                                            {conflicts.length} conflito(s) de ID
                                        </strong>
                                    </div>
                                    <p className="import-warning-text">
                                        Os seguintes menu_id(s) já existem: <strong>{conflicts.join(', ')}</strong>
                                    </p>
                                    <label className="import-skip-label">
                                        <input
                                            type="checkbox"
                                            checked={skipConflicts}
                                            onChange={(e) => setSkipConflicts(e.target.checked)}
                                        />
                                        Pular menus conflitantes e importar apenas os novos
                                    </label>
                                </div>
                            )}

                            {/* Menu cards preview */}
                            <div className="import-preview-list">
                                {parsedData.menus.map((menu, idx) => {
                                    const isConflict = conflicts.includes(menu.menu_id);
                                    const isExpanded = expandedPreview.has(idx);

                                    return (
                                        <div
                                            key={idx}
                                            className={`import-preview-card ${isConflict ? 'import-preview-card--conflict' : ''}`}
                                        >
                                            <div
                                                className="import-preview-card__header"
                                                onClick={() => togglePreviewMenu(idx)}
                                            >
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                <Layers size={14} />
                                                <span className="import-preview-card__name">
                                                    {menu.menu_name}
                                                </span>
                                                <span className="import-preview-card__id">
                                                    {menu.menu_id}
                                                </span>
                                                {isConflict && (
                                                    <span className="import-preview-card__conflict-badge">
                                                        <AlertTriangle size={12} /> Conflito
                                                    </span>
                                                )}
                                                <span className="import-preview-card__count">
                                                    {menu.options.length} opções
                                                </span>
                                            </div>

                                            {isExpanded && (
                                                <div className="import-preview-card__body">
                                                    {menu.description && (
                                                        <p className="import-preview-card__desc">
                                                            {menu.description}
                                                        </p>
                                                    )}
                                                    <div className="ctx-menu-card__tree">
                                                        {(menu.options || []).map((opt, i) => (
                                                            <div key={i} className="ctx-tree-node">
                                                                <div className="ctx-tree-node__option">
                                                                    <span className="ctx-tree-node__dot" />
                                                                    {opt.label} <code className="import-value-tag">({opt.value})</code>
                                                                </div>
                                                                {opt.sub_options && opt.sub_options.length > 0 && (
                                                                    <div className="ctx-tree-node__children">
                                                                        {opt.sub_options.map((sub, j) => (
                                                                            <div key={j} className="ctx-tree-node__sub">
                                                                                <span className="ctx-tree-node__line" />
                                                                                {sub.label} <code className="import-value-tag">({sub.value})</code>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action buttons */}
                            <div className="flex-row-end import-actions">
                                <button
                                    className="btn btn--secondary"
                                    onClick={reset}
                                >
                                    <X size={16} /> Cancelar
                                </button>
                                <button
                                    className="btn btn--primary"
                                    onClick={handleConfirmImport}
                                    disabled={importing || (conflicts.length > 0 && !skipConflicts && conflicts.length === parsedData.menus.length)}
                                >
                                    {importing ? (
                                        'Importando...'
                                    ) : (
                                        <>
                                            <Upload size={16} /> Confirmar Importação
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === STEP: RESULT === */}
                    {step === 'result' && importResult && (
                        <div className="form-section">
                            <div
                                className={`import-result ${importResult.success ? 'import-result--success' : 'import-result--error'}`}
                            >
                                {importResult.success ? (
                                    <>
                                        <CheckCircle size={24} />
                                        <div>
                                            <strong>{importResult.imported} menu(s) importado(s) com sucesso!</strong>
                                            <p className="import-result__detail">
                                                Os menus estão disponíveis para uso no editor de prompts e na configuração.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={24} />
                                        <div>
                                            <strong>Importação falhou</strong>
                                            <ul className="import-errors-list">
                                                {importResult.errors.map((err, i) => (
                                                    <li key={i}><code>{err.field}</code>: {err.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Import log */}
                            <details className="import-schema-ref">
                                <summary className="import-schema-ref__toggle">
                                    <Eye size={14} /> Ver log de importação
                                </summary>
                                <pre className="json-preview json-preview--compact import-log">
                                    {importResult.log.join('\n')}
                                </pre>
                            </details>

                            <div className="flex-row-end import-actions">
                                {importResult.success ? (
                                    <button className="btn btn--primary" onClick={handleClose}>
                                        <CheckCircle size={16} /> Concluir
                                    </button>
                                ) : (
                                    <button className="btn btn--secondary" onClick={reset}>
                                        Tentar novamente
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
