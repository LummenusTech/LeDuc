import type { Metadata } from "next";

import { TrackDetail } from "@/features/content/components/track-detail";

export const metadata: Metadata = { title: "Mapa da trilha · LeDuc" };

export default async function Page({
  params,
}: {
  params: Promise<{ trilhaId: string }>;
}) {
  const { trilhaId } = await params;
  return <TrackDetail trackId={trilhaId} />;
}
