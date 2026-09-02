import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Mapa da trilha · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Mapa da trilha"
      description="As lições em sequência, com o desbloqueio linear já implementado no domínio — falta a tela."
      phase="Fase 5 do plano · aguardando a tela"
    />
  );
}
