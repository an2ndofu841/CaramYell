import type { Metadata } from "next";
import OrganizationClient from "./OrganizationClient";

export const metadata: Metadata = {
  title: "事務所のメンバー",
  description: "事務所のプロジェクトを管理するメンバーを招待・管理する",
};

export default function OrganizationPage() {
  return <OrganizationClient />;
}
