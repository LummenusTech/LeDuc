import type { Metadata } from "next";

import { ActivityPlayerScreen } from "@/features/activity/components/activity-player-screen";

export const metadata: Metadata = { title: "Atividade · LeDuc" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ licaoId: string; atividadeId: string }>;
  searchParams: Promise<{ revisao?: string }>;
}) {
  const { licaoId, atividadeId } = await params;
  const { revisao } = await searchParams;

  return (
    <ActivityPlayerScreen
      lessonId={licaoId}
      activityId={atividadeId}
      isReview={revisao === "1"}
    />
  );
}
