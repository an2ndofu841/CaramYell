import AdminReviewClient from "./AdminReviewClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロジェクト審査",
  robots: { index: false, follow: false },
};

export default function AdminReviewPage() {
  return <AdminReviewClient />;
}
