import type { ReactNode } from "react";

import { WaveShell } from "@/components/layout/wave-shell";

/** Mesma casca das telas de acesso — quem ainda não viu a introdução também não entrou no `AppShell`. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <WaveShell>{children}</WaveShell>;
}
