"use client";

import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

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
  useRecordAccessOnMount();

  return (
    <div className="flex min-h-dvh bg-canvas">
      <SideNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-4 pt-4 sm:px-6 lg:px-8">
          <Button
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

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          {children}
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
            className="relative flex w-72 max-w-[85vw] flex-col gap-6 bg-surface p-4 shadow-raised"
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
