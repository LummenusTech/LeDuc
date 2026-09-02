import type { Metadata } from "next";

import { ComingSoon } from "@/components/feedback/coming-soon";

export const metadata: Metadata = { title: "Ajuda · LeDuc" };

export default function Page() {
  return (
    <ComingSoon
      title="Ajuda"
      description="Como usar o LeDuc, perguntas frequentes e contato com a equipe."
      phase="Fase 9 do plano"
    />
  );
}
