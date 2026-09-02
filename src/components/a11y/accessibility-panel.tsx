"use client";

import { Accessibility, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { A11yControls } from "@/components/a11y/a11y-controls";
import { Button } from "@/components/ui/button";

/**
 * Painel de acessibilidade.
 *
 * Acessível de qualquer tela pela barra superior — não escondido em
 * configurações. Quem trava numa palavra precisa aumentar a fonte naquele
 * momento, não depois de procurar um menu.
 */
export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      // Devolve o foco ao botão que abriu — senão o teclado volta para o topo.
      if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border-2 border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary sm:px-4"
      >
        <Accessibility className="size-5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Acessibilidade</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Fechar painel de acessibilidade"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-title"
            className="relative flex h-full w-full max-w-sm flex-col gap-7 overflow-y-auto bg-surface p-6 shadow-raised"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="a11y-title" className="text-xl font-bold text-ink">
                  Acessibilidade
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Ajuste como o LeDuc aparece para você. Vale para todas as
                  telas.
                </p>
              </div>
              <Button
                variant="quiet"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>

            <A11yControls />
          </div>
        </div>
      )}
    </>
  );
}
