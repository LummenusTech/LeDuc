import { Hammer } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";

/**
 * Placeholder honesto para as telas ainda não construídas.
 *
 * Existe para que a navegação não tenha beco sem saída durante a demonstração:
 * todo item do menu leva a algum lugar que se explica. Some conforme cada fase
 * do plano é entregue.
 */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="flex flex-col items-center px-6 py-12 text-center">
        <span
          className="mb-4 grid size-14 place-items-center rounded-full bg-primary-soft text-primary"
          aria-hidden
        >
          <Hammer className="size-7" />
        </span>

        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-2 max-w-md text-ink-muted">{description}</p>

        <p className="mt-4 rounded-pill bg-surface-muted px-4 py-1.5 text-xs font-semibold text-ink-muted">
          {phase}
        </p>

        <Link
          href={ROUTES.student.home}
          className="mt-7 inline-flex min-h-touch items-center rounded-control bg-primary px-6 font-semibold text-ink-inverse transition-colors hover:bg-primary-hover"
        >
          Voltar ao início
        </Link>
      </Card>
    </div>
  );
}
