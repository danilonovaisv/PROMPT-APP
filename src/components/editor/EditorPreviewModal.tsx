import { useRef } from 'react';
import { Copy, Download, X } from 'lucide-react';
import type { CompiledPromptPayload } from '@/models/promptSchema';

type EditorPreviewModalProps = {
  isOpen: boolean;
  renderedPrompt: string;
  payload: CompiledPromptPayload | null;
  error: string | null;
  onClose: () => void;
  onCopy: () => Promise<void>;
  onDownload: () => void;
};

export function EditorPreviewModal({
  isOpen,
  renderedPrompt,
  payload,
  error,
  onClose,
  onCopy,
  onDownload,
}: EditorPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-preview-title"
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id="editor-preview-title">Preview do prompt</h2>
          <button
            ref={closeButtonRef}
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Fechar preview"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal__body">
          {payload ? (
            <>
              <div className="form-section form-section--flush">
                <h3 className="section-title">Prompt final</h3>
                <pre className="json-preview json-preview--prompt">{renderedPrompt}</pre>
              </div>
              <div className="form-section form-section--flush">
                <h3 className="section-title">Payload técnico</h3>
                <pre className="json-preview">{JSON.stringify(payload, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onCopy}>
            <Copy size={16} /> Copiar prompt
          </button>
          <button className="btn btn--primary" onClick={onDownload}>
            <Download size={16} /> Baixar .json
          </button>
        </div>
      </div>
    </div>
  );
}
