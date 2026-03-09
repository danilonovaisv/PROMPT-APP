import React from 'react';
import { Clock, Edit3, Copy, Download, Trash2 } from 'lucide-react';
import type { Prompt } from '@/models/types';

interface PromptCardProps {
    prompt: Prompt;
    onEdit: (id: number) => void;
    onCopy: (id: number) => void;
    onDownload: (id: number) => void;
    onDelete: (id: number) => void;
    formatDate: (date: Date) => string;
}

const PromptCard: React.FC<PromptCardProps> = ({
    prompt,
    onEdit,
    onCopy,
    onDownload,
    onDelete,
    formatDate,
}) => {
    const roleDescription = prompt.promptPayload.role.description;

    return (
        <div className="prompt-item">
            <div
                className="prompt-item__clickable"
                onClick={() => onEdit(prompt.id!)}
                role="button"
                tabIndex={0}
                aria-label={`Editar prompt: ${prompt.title}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEdit(prompt.id!);
                    }
                }}
            >
                <div className="prompt-item__title">{prompt.title}</div>
                <div className="prompt-item__meta">
                    <Clock size={12} aria-hidden="true" />
                    {' '}<span>{formatDate(prompt.updatedAt)}</span>
                    {roleDescription && (
                        <span className="prompt-meta__suffix">
                            • {roleDescription.substring(0, 50)}
                            {roleDescription.length > 50 ? '...' : ''}
                        </span>
                    )}
                </div>
            </div>
            <div className="prompt-item__actions">
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onEdit(prompt.id!)}
                    aria-label="Editar"
                    title="Editar"
                >
                    <Edit3 size={16} aria-hidden="true" />
                </button>
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onCopy(prompt.id!)}
                    aria-label="Copiar JSON"
                    title="Copiar JSON"
                >
                    <Copy size={16} aria-hidden="true" />
                </button>
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onDownload(prompt.id!)}
                    aria-label="Baixar"
                    title="Baixar .json"
                >
                    <Download size={16} aria-hidden="true" />
                </button>
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onDelete(prompt.id!)}
                    aria-label="Excluir"
                    title="Excluir"
                >
                    <Trash2 size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export default React.memo(PromptCard);
