import type { Metadata } from "next";

import { StudentHome } from "@/features/progress/components/student-home";

export const metadata: Metadata = { title: "Início · LeDuc" };

export default function HomePage() {
  return <StudentHome />;
}
