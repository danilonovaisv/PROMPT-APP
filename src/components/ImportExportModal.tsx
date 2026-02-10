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
} from 'lucide-react';

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
                        <p
                            style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            Selecione um arquivo <strong>.json</strong> exportado pelo Prompt App ou no formato padrão.
                        </p>

                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: 'var(--space-8)',
                                border: '2px dashed var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'border-color var(--transition-fast)',
                                textAlign: 'center',
                            }}
                            onMouseOver={(e) =>
                                ((e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-border-active)')
                            }
                            onMouseOut={(e) =>
                                ((e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--color-border)')
                            }
                        >
                            <FileUp size={32} color="var(--color-text-muted)" />
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                {importing ? 'Importando...' : 'Clique ou arraste um arquivo .json'}
                            </span>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </label>

                        {result && (
                            <div
                                style={{
                                    marginTop: 'var(--space-4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: result.error ? 'var(--color-error)' : 'var(--color-success)',
                                }}
                            >
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
                    <div className="form-section" style={{ marginBottom: 0 }}>
                        <h3 className="form-section__title">
                            <Download size={18} /> Exportar Todos os Prompts
                        </h3>
                        <p
                            style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            Baixe todos os seus prompts organizados por categoria em um único arquivo <strong>.json</strong>.
                        </p>
                        <button className="btn btn--primary btn--lg" onClick={handleExport}>
                            <Download size={18} /> Exportar Tudo (.json)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
