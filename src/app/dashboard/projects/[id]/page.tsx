import type { Metadata } from "next";
import ProjectManageClient from "./ProjectManageClient";

export const metadata: Metadata = {
  title: "プロジェクト管理",
  description: "プロジェクトの管理・編集・支援者管理",
};

export default function ProjectManagePage() {
  return <ProjectManageClient />;
}
