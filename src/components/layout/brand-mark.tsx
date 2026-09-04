import Image from "next/image";

import { cn } from "@/lib/cn";

/** Marca do LeDuc — o mascote, arte definitiva, fundo já transparente. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative grid size-9 shrink-0 place-items-center", className)}
    >
      <Image src="/logo.png" alt="" fill className="object-contain" priority />
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
