/* ======================================================
   SkeletonLoader — Loading states contextuais (Audit Fix #10)
   Substitui o spinner genérico por skeletons por tipo de página
   ====================================================== */

interface SkeletonProps {
  className?: string;
}

function SkeletonBlock({ className = '' }: SkeletonProps) {
  return <div className={`skeleton-block ${className}`} aria-hidden="true" />;
}

/** Skeleton para cards de categoria na HomePage */
export function SkeletonCategoryGrid() {
  return (
    <section aria-label="Carregando categorias..." aria-busy="true">
      <div className="category-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card skeleton-card">
            <SkeletonBlock className="skeleton-block--icon" />
            <SkeletonBlock className="skeleton-block--title" />
            <SkeletonBlock className="skeleton-block--subtitle" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton para lista de prompts na CategoryPage */
export function SkeletonPromptList() {
  return (
    <section aria-label="Carregando templates..." aria-busy="true">
      <div className="prompt-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="prompt-item skeleton-card">
            <div className="skeleton-prompt-info">
              <SkeletonBlock className="skeleton-block--title" />
              <SkeletonBlock className="skeleton-block--subtitle" />
            </div>
            <SkeletonBlock className="skeleton-block--actions" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton genérico para editor / páginas complexas */
export function SkeletonEditor() {
  return (
    <section aria-label="Carregando editor..." aria-busy="true" className="app-content">
      <div className="editor-form--constrained">
        <div className="form-section">
          <SkeletonBlock className="skeleton-block--section-title" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="form-group">
              <SkeletonBlock className="skeleton-block--label" />
              <SkeletonBlock className="skeleton-block--input" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
