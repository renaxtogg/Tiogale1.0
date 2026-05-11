"use client";

import { startTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { ESTADO_CERT_LABELS } from "@/types";
import type { EstadoCert } from "@/types";
import { updateEstadoCertificacion } from "./actions";

const NEXT_STATE: Record<EstadoCert, EstadoCert | null> = {
  borrador: "aprobada",
  aprobada: "cobrada",
  cobrada:  null,
};

const VARIANT: Record<EstadoCert, "secondary" | "success" | "outline"> = {
  borrador: "secondary",
  aprobada: "success",
  cobrada:  "outline",
};

interface Props {
  cert: { id: string; estado: string };
}

/**
 * Inline badge that advances the certification state on click.
 * borrador → aprobada → cobrada (terminal)
 */
export function CertEstadoButton({ cert }: Props) {
  const estado    = cert.estado as EstadoCert;
  const nextState = NEXT_STATE[estado];

  function handleClick() {
    if (!nextState) return;
    const label = ESTADO_CERT_LABELS[nextState];
    if (!window.confirm(`¿Cambiar estado a "${label}"?`)) return;
    startTransition(() => {
      updateEstadoCertificacion(cert.id, nextState);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!nextState}
      title={nextState ? `Avanzar a ${ESTADO_CERT_LABELS[nextState]}` : "Estado final"}
      className="cursor-pointer disabled:cursor-default"
    >
      <Badge variant={VARIANT[estado]}>
        {ESTADO_CERT_LABELS[estado]}
      </Badge>
    </button>
  );
}
