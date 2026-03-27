/* ======================================================
   Breadcrumb — orientação espacial (A11y Audit Fix #09)
   WCAG AA + WAI-ARIA BreadcrumbList
   ====================================================== */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="breadcrumb__item">
              {!isLast && item.href ? (
                <>
                  <Link to={item.href} className="breadcrumb__link">
                    {item.label}
                  </Link>
                  <ChevronRight
                    size={14}
                    className="breadcrumb__separator"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <span
                  className="breadcrumb__current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
