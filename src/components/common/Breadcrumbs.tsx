import React from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center flex-wrap gap-2 ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="material-symbols-outlined text-on-surface-variant/50" style={{ fontSize: '18px' }}>
                chevron_right
              </span>
            )}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="label-sm text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
              >
                {item.label}
              </button>
            ) : (
              <span className={`label-sm ${isLast ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
