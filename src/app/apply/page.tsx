import type { Metadata } from "next";
import ApplyClient from "./ApplyClient";

export const metadata: Metadata = {
  title: "掲載のお申し込み",
  description:
    "芸能事務所・レーベル・運営チームの方向けの、CaramYell へのプロジェクト掲載申し込みフォームです。",
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return <ApplyClient />;
}
