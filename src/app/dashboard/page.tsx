import BackerDashboardClient from "./BackerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マイページ",
  description: "応援したプロジェクトとリターンのお届け状況",
};

export default function DashboardPage() {
  return <BackerDashboardClient />;
}
