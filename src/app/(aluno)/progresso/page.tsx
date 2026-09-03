import type { Metadata } from "next";

import { ProgressOverview } from "@/features/analytics/components/progress-overview";

export const metadata: Metadata = { title: "Progresso · LeDuc" };

export default function Page() {
  return <ProgressOverview />;
}
