import { cn } from "@/lib/cn";

/**
 * Marca do LeDuc.
 *
 * Placeholder até a arte definitiva do mascote chegar: uma folha sobre a água,
 * no lugar do bicho que aparece nas telas. Fica isolado num componente para que
 * a troca seja um arquivo só.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-surface",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M12 4c4 0 7 2.5 7 6.5S15.5 18 12 18s-7-3-7-7.5"
          className="text-tint-verde-solid"
        />
        <path d="M12 18V7" className="text-tint-verde-ink" />
        <path d="M3 21c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0" className="text-primary" />
      </svg>
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="text-xs font-bold leading-tight tracking-wider text-ink-inverse">
        LEDUC
        <br />
        INSTITUCIONAL
      </span>
    </div>
  );
}
