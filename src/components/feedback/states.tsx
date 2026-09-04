import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Estados vazio e de erro.
 *
 * Erro sempre diz o que aconteceu e o que fazer — nunca só "algo deu errado".
 * Conexão instável é a norma para este público, então errar é rotina e a saída
 * precisa estar sempre visível.
 */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border-2 border-dashed border-line bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-surface-muted text-ink-muted"><Icon className="size-7" aria-hidden /></span>
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Não foi possível carregar",
  description = "Verifique sua conexão e tente de novo. O que você já fez continua salvo.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-card border border-danger/15 bg-danger-soft px-6 py-8 text-center",
        className,
      )}
    >
      <CircleAlert className="mb-3 size-8 text-danger" aria-hidden />
      <p className="font-semibold text-danger">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink">{description}</p>
      {onRetry && (
        <Button size="compact" className="mt-5" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
