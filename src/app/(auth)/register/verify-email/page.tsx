import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <MailCheck className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Revise su correo
        </h1>
        <p className="text-sm text-muted-foreground">
          Le enviamos un enlace de confirmación. Haga clic en él para activar su
          cuenta y acceder al sistema.
        </p>
        <p className="text-xs text-muted-foreground">
          Si no lo recibe en unos minutos, revise su carpeta de spam.
        </p>
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Volver al inicio de sesión</Link>
      </Button>
    </div>
  );
}
