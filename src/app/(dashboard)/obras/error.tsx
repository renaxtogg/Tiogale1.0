"use client";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { AlertCircle } from "lucide-react";

export default function ObrasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-semibold">Error al cargar obras</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
        <Button onClick={reset} variant="outline">Reintentar</Button>
      </div>
    </PageContainer>
  );
}
