"use client";

import { startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  /** Server Action to call when deletion is confirmed */
  action: () => Promise<void>;
  /** Confirmation message shown before deleting */
  confirmMessage?: string;
  label?: string;
}

/**
 * Client Component that wraps a Server Action with a browser confirm() guard.
 * Replace with a Modal dialog in a future sprint for better UX.
 */
export function DeleteButton({
  action,
  confirmMessage = "¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.",
  label,
}: DeleteButtonProps) {
  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(() => { action(); });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleClick}
      type="button"
    >
      <Trash2 className="h-4 w-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
