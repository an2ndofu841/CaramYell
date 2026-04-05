import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "CaramYellとは",
  description:
    "CaramYellは手数料0%で誰でも簡単に使えるクラウドファンディングサービスです。AIサポート・アカウント不要出資・最短30分掲載で、夢を叶える人と応援する人をつなぎます。",
};

export default function AboutPage() {
  return <AboutClient />;
}
