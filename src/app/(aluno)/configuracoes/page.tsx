import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Configurações · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Configurações"
      description="Conta, dados baixados para uso offline e privacidade."
      phase="Fase 9 do plano"
    />
  );
}
