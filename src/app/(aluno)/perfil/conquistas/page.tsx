import type { Metadata } from "next";

import { AchievementsGrid } from "@/features/analytics/components/achievements-grid";

export const metadata: Metadata = { title: "Conquistas · LeDuc" };

export default function Page() {
  return <AchievementsGrid />;
}
