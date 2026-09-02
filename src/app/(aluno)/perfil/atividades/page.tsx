import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Atividades · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Atividades"
      description="Histórico do que você estudou, lição por lição."
      phase="Fase 7 do plano"
    />
  );
}
