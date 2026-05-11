import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "./loading-spinner";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  keyExtractor: (row: T) => string;
}

/**
 * Generic DataTable — plug in columns and data.
 * Wire up react-table or TanStack Table here when the module needs sorting/filtering.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = "Sin datos",
  emptyDescription = "No hay registros para mostrar.",
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={keyExtractor(row)}>
              {columns.map((col) => (
                <TableCell key={String(col.key)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
