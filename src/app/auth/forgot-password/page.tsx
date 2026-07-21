import PlaceholderPage from "@/components/layout/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "パスワードの再設定" };

export default function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      emoji="🔑"
      title="パスワードの再設定"
      description="登録メールアドレスへ再設定用リンクをお送りする機能です。"
    />
  );
}
