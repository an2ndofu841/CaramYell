import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "プロジェクトの状況を管理する",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
