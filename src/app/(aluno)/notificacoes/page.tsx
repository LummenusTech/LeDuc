import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Notificações · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Notificações"
      description="Avisos do professor, lembretes de estudo e novidades do aplicativo."
      phase="Fase 10 do plano"
    />
  );
}
