import CreatorDashboardClient from "./CreatorDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "掲載中のプロジェクト",
  description: "掲載しているプロジェクトの状況を管理する",
};

export default function CreatorDashboardPage() {
  return <CreatorDashboardClient />;
}
