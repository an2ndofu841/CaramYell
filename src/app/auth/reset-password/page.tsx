import ResetPasswordClient from "./ResetPasswordClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "新しいパスワードの設定" };

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
