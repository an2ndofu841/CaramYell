import CreateProjectClient from "./CreateProjectClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロジェクトを作る",
  description: "AIのサポートで、最短10分でクラウドファンディングページを作れます",
};

export default function CreateProjectPage() {
  return <CreateProjectClient />;
}
