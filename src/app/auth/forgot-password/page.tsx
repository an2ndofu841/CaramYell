import ForgotPasswordClient from "./ForgotPasswordClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "パスワードの再設定" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
