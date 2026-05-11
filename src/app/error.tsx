"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-semibold">Ocurrió un error</h1>
        <p className="text-muted-foreground text-sm">
          {error.message || "Algo salió mal. Por favor intente nuevamente."}
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
