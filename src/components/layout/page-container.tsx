import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * The primary heading of the page. Rendered as an <h1>.
   */
  title?: string;
  /**
   * Optional subtitle displayed below the title.
   */
  description?: string;
  /**
   * Slot for action buttons rendered to the right of the title.
   */
  actions?: React.ReactNode;
}

/**
 * Standard page wrapper — consistent padding, title area, and action slot.
 * Wrap every module page in this component to maintain layout consistency.
 */
export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <main className={cn("flex-1 space-y-6 p-6 lg:p-8", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </main>
  );
}
