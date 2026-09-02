import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Todas as trilhas · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Todas as trilhas"
      description="A biblioteca completa, com filtros por módulo e por nível."
      phase="Fase 5 do plano"
    />
  );
}
