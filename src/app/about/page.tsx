import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "CaramYellとは",
  description:
    "CaramYellは、アーティスト・アイドルの生誕祭や周年企画、作品づくりのためのクラウドファンディングです。芸能事務所・レーベルからの掲載を受け付けています。掲載者の手数料は0%です。",
};

export default function AboutPage() {
  return <AboutClient />;
}
