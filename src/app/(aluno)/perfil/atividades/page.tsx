import type { Metadata } from "next";

import { ActivityHistory } from "@/features/analytics/components/activity-history";

export const metadata: Metadata = { title: "Atividades · LeDuc" };

export default function Page() {
  return <ActivityHistory />;
}
