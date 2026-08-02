"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Save,
  Camera,
  Trash2,
  AtSign,
  Globe,
  User,
  Mail,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types";

const MAX_BIO = 300;
const MAX_DISPLAY_NAME = 50;

interface FormState {
  displayName: string;
  username: string;
  bio: string;
  websiteUrl: string;
  twitterHandle: string;
}

const emptyForm: FormState = {
  displayName: "",
  username: "",
  bio: "",
  websiteUrl: "",
  twitterHandle: "",
};

function toForm(profile: Profile): FormState {
  return {
    displayName: profile.display_name || "",
    username: profile.username || "",
    bio: profile.bio || "",
    websiteUrl: profile.website_url || "",
    twitterHandle: profile.twitter_handle || "",
  };
}

export default function ProfileSettingsClient() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<FormState>(emptyForm);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/profile");
      if (res.status === 401) {
        router.push("/auth/login?redirect=/dashboard/settings");
        return;
      }
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setForm(toForm(data.profile));
        setSavedForm(toForm(data.profile));
      }
      setEmail(data.email || "");
    } catch {
      toast.error("プロフィールの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/dashboard/settings");
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading, router, fetchProfile]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (key) => form[key] !== savedForm[key]
  );

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast.error("表示名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      setProfile(data.profile);
      setForm(toForm(data.profile));
      setSavedForm(toForm(data.profile));
      await refreshProfile();
      toast.success("プロフィールを保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/dashboard/profile/avatar", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "アップロードに失敗しました");

      setProfile(data.profile);
      await refreshProfile();
      toast.success("アイコンを更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/dashboard/profile/avatar", {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "削除に失敗しました");

      setProfile(data.profile);
      await refreshProfile();
      toast.success("アイコンを削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-candy-pink mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initial = (form.displayName || email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen pt-20" style={{ background: "#FFFBF5" }}>
      <div
        className="py-8"
        style={{ background: "linear-gradient(135deg, #4A2C17 0%, #31200E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors font-medium mb-3"
          >
            <ChevronLeft size={16} />
            ダッシュボード
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">プロフィール設定</h1>
          <p className="text-white/50 text-sm">
            プロジェクトページに表示される、あなたの情報を編集できます
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* アイコン */}
        <AnimatedSection animation="fade-up">
          <Card>
            <h2 className="font-bold text-gray-800 mb-4">アイコン</h2>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-caramel-100 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={form.displayName || "アイコン"}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="text-3xl font-bold text-white w-full h-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #F2807B, #E8842C)",
                      }}
                    >
                      {initial}
                    </span>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Camera size={16} />}
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    画像を選ぶ
                  </Button>
                  {profile?.avatar_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      disabled={uploading}
                      onClick={handleAvatarRemove}
                    >
                      削除
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  PNG / JPEG / WebP / GIF・2MBまで。正方形の画像がきれいに表示されます。
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarSelect(file);
                  }}
                />
              </div>
            </div>
          </Card>
        </AnimatedSection>

        {/* 基本情報 */}
        <AnimatedSection animation="fade-up" delay={80}>
          <Card>
            <h2 className="font-bold text-gray-800 mb-4">基本情報</h2>
            <div className="space-y-4">
              <Input
                label="表示名 ※必須"
                placeholder="例：カラメル工房"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                icon={<User size={16} />}
                maxLength={MAX_DISPLAY_NAME}
                fullWidth
                hint="プロジェクトページで支援者に表示される名前です"
              />

              <Input
                label="ユーザーID（任意）"
                placeholder="caramel_studio"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                icon={<AtSign size={16} />}
                maxLength={20}
                fullWidth
                hint="半角英小文字・数字・アンダースコアの3〜20文字。全体で重複しない値にしてください"
              />

              <Textarea
                label="自己紹介（任意）"
                placeholder="これまでの活動や、プロジェクトへの想いを書いてみましょう"
                value={form.bio}
                onChange={(e) => update("bio", e.target.value.slice(0, MAX_BIO))}
                rows={5}
                fullWidth
                hint={`${form.bio.length} / ${MAX_BIO}文字`}
              />
            </div>
          </Card>
        </AnimatedSection>

        {/* リンク */}
        <AnimatedSection animation="fade-up" delay={160}>
          <Card>
            <h2 className="font-bold text-gray-800 mb-4">リンク</h2>
            <div className="space-y-4">
              <Input
                label="Webサイト（任意）"
                placeholder="example.com"
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                icon={<Globe size={16} />}
                fullWidth
                hint="https:// は省略しても保存時に補完されます"
              />

              <Input
                label="X（旧Twitter）のユーザー名（任意）"
                placeholder="caramyell"
                value={form.twitterHandle}
                onChange={(e) =>
                  update("twitterHandle", e.target.value.replace(/^@/, ""))
                }
                icon={<AtSign size={16} />}
                maxLength={15}
                fullWidth
                hint="@ は不要です"
              />
            </div>
          </Card>
        </AnimatedSection>

        {/* アカウント情報 */}
        <AnimatedSection animation="fade-up" delay={240}>
          <Card variant="outlined">
            <h2 className="font-bold text-gray-800 mb-4">アカウント情報</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-caramel-500 flex-shrink-0" />
                <dt className="text-gray-400 w-28 flex-shrink-0">メールアドレス</dt>
                <dd className="font-semibold text-gray-700 truncate">{email}</dd>
              </div>
              {profile?.created_at && (
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className="text-caramel-500 flex-shrink-0" />
                  <dt className="text-gray-400 w-28 flex-shrink-0">登録日</dt>
                  <dd className="font-semibold text-gray-700">
                    {new Date(profile.created_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-xs text-gray-400 mt-4">
              メールアドレスとパスワードの変更は現在サポート窓口で承っています。
            </p>
          </Card>
        </AnimatedSection>

        {/* 二段階認証 */}
        <AnimatedSection animation="fade-up" delay={280}>
          <Card variant="outlined">
            <h2 className="font-bold text-gray-800 mb-4">二段階認証</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              認証アプリの6桁のコードをログイン時に求めます。パスワードが漏れても、
              アプリを持っている人以外は入れなくなります。
            </p>
            <Link
              href="/auth/mfa?next=/dashboard/settings"
              className="inline-flex items-center gap-2 text-sm font-bold text-caramel-500 hover:text-caramel-600"
            >
              <ShieldCheck size={16} />
              二段階認証を設定する
            </Link>
          </Card>
        </AnimatedSection>

        {/* 保存 */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pb-4">
          {isDirty && (
            <p className="text-xs text-caramel-600 font-semibold">
              保存されていない変更があります
            </p>
          )}
          <Button
            size="lg"
            icon={<Save size={18} />}
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            変更を保存する
          </Button>
        </div>
      </div>
    </div>
  );
}
