import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Seção com cabeçalho e "Ver todos", listando cards em rolagem horizontal.
 *
 * Rolagem nativa em vez de setas: funciona com toque, com roda do mouse e com
 * teclado sem JavaScript, e não some quando a conexão cai.
 */
export function CardCarousel({
  title,
  seeAllHref,
  children,
}: {
  title: string;
  seeAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`sec-${slug(title)}`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          id={`sec-${slug(title)}`}
          className="text-xl font-bold tracking-tight text-ink sm:text-2xl"
        >
          {title}
        </h2>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2 text-sm font-semibold text-primary hover:underline"
          >
            Ver todos
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <ul className="grid auto-cols-[minmax(14rem,1fr)] grid-flow-col gap-4">
          {children}
        </ul>
      </div>
    </section>
  );
}

function slug(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-");
}
