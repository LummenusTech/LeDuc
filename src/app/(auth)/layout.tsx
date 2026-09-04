import type { ReactNode } from "react";

import { WaveShell } from "@/components/layout/wave-shell";

/**
 * Casca das telas de acesso — a onda de fundo e o botão de acessibilidade,
 * compartilhados por entrar e recuperar senha.
 *
 * Vive aqui, e não dentro de `AppShell`, porque quem ainda não entrou não
 * atravessa aquela casca — mas precisa da MESMA capacidade de ajustar fonte e
 * contraste antes de conseguir ler "Entrar".
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <WaveShell>{children}</WaveShell>;
}
