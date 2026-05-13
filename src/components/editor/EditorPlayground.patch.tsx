/**
 * EditorPlayground.patch.tsx
 * Melhorias de UX mobile para Memória Fixa.
 * Aplicar no arquivo src/components/editor/EditorPlayground.tsx
 */

// ===== ADICIONAR ESTADOS DE VALIDAÇÃO =====
const [memoryErrors, setMemoryErrors] = useState<Record<string, string>>({});
const [activeMemoryIndex, setActiveMemoryIndex] = useState<number | null>(null);

// ===== COMPONENTE DE ITEM DE MEMÓRIA COM VALIDAÇÃO =====
interface MemoryItemProps {
  index: number;
  memory: { key: string; value: string };
  onUpdate: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  error?: string;
  isDuplicate?: boolean;
  isMobile: boolean;
}

function MemoryItem({ index, memory, onUpdate, onRemove, error, isDuplicate, isMobile }: MemoryItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`
        group relative flex items-start gap-2 p-3 rounded-lg border transition-all
        ${isMobile ? 'flex-col gap-2' : 'flex-row'}
        ${error || isDuplicate ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}
        ${isMobile ? 'min-h-[80px]' : 'min-h-[56px]'}
        focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400
      `}
      role="listitem"
      aria-invalid={!!error || isDuplicate}
    >
      {/* Ícone de arrastar (visível apenas em desktop, para reorder) */}
      {!isMobile && (
        <div className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing" aria-label="Reordenar">
          <GripVertical size={16} />
        </div>
      )}

      {/* Campo de chave */}
      <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
        <label className="text-xs font-medium text-gray-500 mb-1 block" htmlFor={`memory-key-${index}`}>
          Chave {isDuplicate && <span className="text-red-500">(duplicada)</span>}
        </label>
        <input
          ref={inputRef}
          id={`memory-key-${index}`}
          type="text"
          value={memory.key}
          onChange={(e) => onUpdate(index, 'key', e.target.value)}
          placeholder="ex: nome_cliente"
          className={`
            w-full px-3 py-2 text-sm rounded-md border transition-colors
            ${isDuplicate ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
            focus:outline-none focus:ring-1 focus:ring-blue-400
            ${isMobile ? 'min-h-[44px] text-base' : ''} /* 44px hit target para mobile */
          `}
          aria-describedby={error ? `memory-error-${index}` : undefined}
          autoComplete="off"
        />
      </div>

      {/* Campo de valor */}
      <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
        <label className="text-xs font-medium text-gray-500 mb-1 block" htmlFor={`memory-value-${index}`}>
          Valor
        </label>
        <input
          id={`memory-value-${index}`}
          type="text"
          value={memory.value}
          onChange={(e) => onUpdate(index, 'value', e.target.value)}
          placeholder="ex: Acme Corp"
          className={`
            w-full px-3 py-2 text-sm rounded-md border border-gray-300
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400
            ${isMobile ? 'min-h-[44px] text-base' : ''}
          `}
          autoComplete="off"
        />
      </div>

      {/* Botão de remover */}
      <button
        onClick={() => onRemove(index)}
        className={`
          flex items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-50
          transition-colors shrink-0
          ${isMobile ? 'w-full py-3 mt-1' : 'w-8 h-8 mt-6'}
        `}
        aria-label={`Remover memória ${memory.key || `#${index + 1}`}`}
        title="Remover"
      >
        <Trash2 size={isMobile ? 18 : 16} />
        {isMobile && <span className="ml-2 text-sm">Remover</span>}
      </button>

      {/* Mensagem de erro */}
      {error && (
        <div
          id={`memory-error-${index}`}
          className="absolute -bottom-6 left-0 text-xs text-red-600 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

// ===== FUNÇÃO DE VALIDAÇÃO DE DUPLICIDADE =====
function validateMemoryKeys(memory: Array<{ key: string; value: string }>): Record<string, string> {
  const errors: Record<string, string> = {};
  const keyCounts: Record<string, number[]> = {};

  memory.forEach((m, idx) => {
    const normalized = m.key.trim().toLowerCase();
    if (!normalized) {
      errors[idx] = 'A chave não pode estar vazia';
      return;
    }
    if (!keyCounts[normalized]) keyCounts[normalized] = [];
    keyCounts[normalized].push(idx);
  });

  Object.entries(keyCounts).forEach(([key, indices]) => {
    if (indices.length > 1) {
      indices.forEach(idx => {
        errors[idx] = `A chave "${key}" está duplicada (${indices.length}x). Use uma chave única.`;
      });
    }
  });

  return errors;
}

// ===== MODIFICAR O RENDER DA SEÇÃO DE MEMÓRIA =====
{/* Seção Memória Fixa */}
<section className="space-y-4" aria-labelledby="memory-heading">
  <div className="flex items-center justify-between">
    <h3 id="memory-heading" className="text-sm font-semibold text-gray-700">
      Memória Fixa
    </h3>
    <span className="text-xs text-gray-400">
      {memory.length} {memory.length === 1 ? 'variável' : 'variáveis'}
    </span>
  </div>

  {/* Estado vazio com CTA clara */}
  {memory.length === 0 && (
    <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
      <Database size={32} className="mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-500 mb-3">
        Nenhuma variável de memória configurada
      </p>
      <button
        onClick={addMemoryItem}
        className="
          inline-flex items-center gap-2 px-4 py-2.5
          bg-blue-600 text-white text-sm font-medium rounded-lg
          hover:bg-blue-700 active:bg-blue-800
          transition-colors
          min-h-[44px] /* Hit target mínimo */
        "
      >
        <Plus size={16} />
        Adicionar primeira variável
      </button>
    </div>
  )}

  {/* Lista de memórias */}
  {memory.length > 0 && (
    <div className="space-y-6" role="list">
      {memory.map((m, idx) => (
        <MemoryItem
          key={`${idx}-${m.key}`}
          index={idx}
          memory={m}
          onUpdate={handleMemoryUpdate}
          onRemove={handleMemoryRemove}
          error={memoryErrors[idx]}
          isDuplicate={Object.values(memoryErrors).some(
            e => e.includes('duplicada') && memoryErrors[idx]?.includes('duplicada')
          )}
          isMobile={isMobileViewport}
        />
      ))}
    </div>
  )}

  {/* Botão adicionar (quando já há itens) */}
  {memory.length > 0 && (
    <button
      onClick={addMemoryItem}
      className="
        w-full flex items-center justify-center gap-2 py-3
        border-2 border-dashed border-gray-300 rounded-lg
        text-sm text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50
        active:bg-blue-100 transition-colors
        min-h-[44px]
      "
    >
      <Plus size={16} />
      Adicionar variável
    </button>
  )}

  {/* Banner de erro global se houver duplicatas */}
  {Object.keys(memoryErrors).length > 0 && (
    <div
      className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
      role="alert"
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Corrija os erros antes de salvar:</p>
        <ul className="mt-1 list-disc list-inside text-xs">
          {Object.entries(memoryErrors).map(([idx, err]) => (
            <li key={idx}>Item {parseInt(idx) + 1}: {err}</li>
          ))}
        </ul>
      </div>
    </div>
  )}
</section>
