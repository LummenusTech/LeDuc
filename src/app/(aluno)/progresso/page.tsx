import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Progresso · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Progresso"
      description="Sua evolução ao longo do tempo, tempo de estudo e desempenho por módulo — a única tela de desempenho do produto."
      phase="Fase 7 do plano · aguardando a tela"
    />
  );
}
