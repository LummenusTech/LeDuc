"use client";

import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AccessibilityPanel } from "@/components/a11y/accessibility-panel";
import { BrandMark } from "@/components/layout/brand-mark";
import { BottomNav, DrawerNav, SideNav } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { useRecordAccessOnMount } from "@/features/analytics/hooks";

/**
 * Casca do aplicativo do aluno.
 *
 * Desktop: barra lateral fixa. Telas estreitas: barra inferior com os quatro
 * itens principais e gaveta para o restante — decisão registrada no plano.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useRecordAccessOnMount();

  useEffect(() => {
    if (!isDrawerOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isDrawerOpen]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <SideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-canvas/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <Button
            ref={menuButtonRef}
            variant="quiet"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir mais opções"
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
          >
            <Menu className="size-6" aria-hidden />
          </Button>

          <div className="min-w-0 flex-1" />

          <AccessibilityPanel />

          <Link
            href={ROUTES.student.notifications}
            aria-label="Notificações"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-card transition-colors hover:bg-primary-soft"
          >
            <Bell className="size-5" aria-hidden />
          </Link>
        </header>

        <main className="flex-1 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-12 lg:pt-9">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <BottomNav />

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            className="relative flex w-80 max-w-[88vw] flex-col gap-6 border-r border-line bg-surface p-5 shadow-raised"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandMark />
                <span className="text-xs font-bold leading-tight tracking-wider text-ink">
                  LEDUC
                  <br />
                  INSTITUCIONAL
                </span>
              </div>
              <Button
                variant="quiet"
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Fechar"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>

            <DrawerNav onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
