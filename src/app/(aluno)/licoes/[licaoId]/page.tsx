import type { Metadata } from "next";

import { LessonOverview } from "@/features/activity/components/lesson-overview";

export const metadata: Metadata = { title: "Lição · LeDuc" };

export default async function Page({
  params,
}: {
  params: Promise<{ licaoId: string }>;
}) {
  const { licaoId } = await params;
  return <LessonOverview lessonId={licaoId} />;
}
