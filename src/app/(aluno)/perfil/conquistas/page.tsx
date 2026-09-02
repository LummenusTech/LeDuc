import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Conquistas · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Conquistas"
      description="Suas medalhas, níveis e o XP acumulado."
      phase="Fase 7 do plano"
    />
  );
}
