import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "運営CMS",
  robots: { index: false, follow: false },
};

// 判定はここで済ませる。AdminShell 側のリダイレクトはブラウザで JS が
// 動いてから初めて効くので、それだけだと画面の中身が誰にでも返ってしまう。
// middleware ではなくレイアウトに置いているのは、Next の middleware に
// 迂回の脆弱性が繰り返し見つかっているため。
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
