import type { ReactNode } from "react";

import { AccessibilityPanel } from "@/components/a11y/accessibility-panel";

/**
 * Casca das telas de acesso — a onda de fundo e o botão de acessibilidade,
 * compartilhados por entrar e recuperar senha.
 *
 * Vive aqui, e não dentro de `AppShell`, porque quem ainda não entrou não
 * atravessa aquela casca — mas precisa da MESMA capacidade de ajustar fonte e
 * contraste antes de conseguir ler "Entrar".
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <AccessibilityPanel />
      </div>

      {/* Onda orgânica do fundo, como nas telas. Decorativa. */}
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
