import type { ReactNode } from "react";

/** Shared empty / no-results state: centered icon + title + optional hint and
 *  action (e.g. a "clear filters" button). Used by tables and pickers so a zero
 *  result looks intentional instead of like a broken/blank panel. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-6 py-12 text-center ${className}`}>
      {icon && (
        <div className="text-dim" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-muted">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-dim">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
