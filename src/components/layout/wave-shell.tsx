import type { ReactNode } from "react";

import { AccessibilityPanel } from "@/components/a11y/accessibility-panel";

/**
 * Casca com a onda de fundo roxa e o botão de acessibilidade no canto.
 *
 * Compartilhada por telas de acesso (entrar, recuperar senha) e onboarding —
 * todas telas fora do `AppShell` que ainda assim precisam da mesma capacidade
 * de ajustar fonte e contraste antes de o aluno seguir em frente.
 */
export function WaveShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <AccessibilityPanel />
      </div>

      {/* Onda orgânica do fundo. Decorativa. */}
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M0 210C170 120 300 340 470 300S760 60 940 120s250 330 500 250v530H0z"
          className="fill-sidebar opacity-70"
        />
        <path
          d="M0 640c220-110 380 60 560 20s300-220 480-160 260 220 400 150v250H0z"
          className="fill-primary-hover opacity-50"
        />
      </svg>

      {children}
    </main>
  );
}
