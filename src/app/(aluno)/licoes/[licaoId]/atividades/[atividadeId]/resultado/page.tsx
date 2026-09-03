import type { Metadata } from "next";

import { ActivityResult } from "@/features/activity/components/activity-result";

export const metadata: Metadata = { title: "Resultado · LeDuc" };

export default async function Page({
  params,
}: {
  params: Promise<{ licaoId: string; atividadeId: string }>;
}) {
  const { licaoId, atividadeId } = await params;
  return <ActivityResult lessonId={licaoId} activityId={atividadeId} />;
}
