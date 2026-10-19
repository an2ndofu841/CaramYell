"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Wand2,
  Check,
  Info,
  Loader2,
  Save,
  ExternalLink,
  Link2,
  Copy,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import ProjectImagePicker from "@/components/project/ProjectImagePicker";
import EnglishPanel from "@/components/project/EnglishPanel";
import FaqEditor from "@/components/project/FaqEditor";
import {
  normalizeSlug,
  normalizeSlugInput,
  slugError,
} from "@/lib/project/slug";
import ThemeEditor from "@/components/project/ThemeEditor";
import { DEFAULT_THEME, resolveTheme } from "@/lib/theme/project-theme";
import { jstDateAfterDays } from "@/lib/date/campaign-end";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { MilestoneInput, ProjectFaq } from "@/types";
import { BACKER_FEE_PERCENT, feeExample } from "@/lib/config/fees";

const FEE_EXAMPLE = feeExample(3000);

/** 第1目標の下限。支援の最低額（¥100）に合わせている */
const MIN_GOAL_AMOUNT = 100;

/** 公開URLのプレビュー用。プロトコルまで見せる必要はない */
const SITE_HOST = (process.env.NEXT_PUBLIC_APP_URL || "https://caramyell.com")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

const categories = [
  { slug: "music", name: "音楽" },
  { slug: "art", name: "アート" },
  { slug: "game", name: "ゲーム" },
  { slug: "tech", name: "テクノロジー" },
  { slug: "video", name: "動画・映像" },
  { slug: "food", name: "フード" },
  { slug: "fashion", name: "ファッション" },
  { slug: "photo", name: "写真" },
  { slug: "social", name: "社会・コミュニティ" },
  { slug: "other", name: "その他" },
];

const steps = [
  { id: 1, title: "基本情報" },
  { id: 2, title: "詳細" },
  { id: 3, title: "ゴール・期間" },
  { id: 4, title: "リターン" },
  { id: 5, title: "デザイン" },
  { id: 6, title: "確認・申請" },
];

type RewardInput = {
  title: string;
  description: string;
  /** 英語表示用（任意）。空なら日本語がそのまま出る */
  titleEn: string;
  descriptionEn: string;
  amount: number;
  rewardType: "physical" | "digital" | "experience" | "no_reward";
  needsAddress: boolean;
  quantityTotal?: number;
};

export default function CreateProjectClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");
  const { user, isCreator, loading: authLoading } = useAuth();
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId));
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    slug: "",
    category: "",
    description: "",
    story: "",
    // 英語に切り替えたときに出す文面（すべて任意）
    titleEn: "",
    taglineEn: "",
    descriptionEn: "",
    storyEn: "",
    endDate: "",
    mainImageUrl: null as string | null,
    images: [] as string[],
    milestones: [
      { amount: 50000, title: "", description: "" },
    ] as MilestoneInput[],
    allowFreeAmount: true,
    allowComments: true,
    rewards: [] as RewardInput[],
    faqs: [] as ProjectFaq[],
    theme: { ...DEFAULT_THEME },
  });

  // ステップが変わったらページ先頭へ戻す
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ?id= 付きで来たら下書きを読み戻す。これが無いと、画面を離れた時点で
  // savedProjectId が消え、続きから直せずに作り直しになる。
  useEffect(() => {
    if (!draftId || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/dashboard/projects/${draftId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "下書きを読み込めませんでした");
        if (cancelled) return;

        const p = data.project;
        if (!["draft", "reviewing", "cancelled"].includes(p.status)) {
          // 公開後にこの導線を通すとリターンが作り直しになる
          toast.error("公開中のプロジェクトは管理画面から編集してください");
          router.replace(`/dashboard/projects/${p.id}`);
          return;
        }

        const milestones = [...(p.project_milestones || [])]
          .sort((a, b) => a.amount - b.amount)
          .map((m) => ({
            amount: m.amount,
            title: m.title || "",
            description: m.description || "",
          }));

        setFormData({
          title: p.title || "",
          tagline: p.tagline || "",
          slug: p.slug || "",
          category: p.categories?.slug || "",
          description: p.description || "",
          story: p.story || "",
          titleEn: p.title_en || "",
          taglineEn: p.tagline_en || "",
          descriptionEn: p.description_en || "",
          storyEn: p.story_en || "",
          endDate: p.end_date ? p.end_date.slice(0, 10) : "",
          mainImageUrl: p.main_image_url || null,
          images: Array.isArray(p.images) ? p.images : [],
          milestones: milestones.length
            ? milestones
            : [{ amount: p.goal_amount || 50000, title: "", description: "" }],
          allowFreeAmount: p.allow_free_amount !== false,
          allowComments: p.allow_comments !== false,
          faqs: Array.isArray(p.faqs) ? p.faqs : [],
          theme: resolveTheme(p.theme),
          rewards: (p.rewards || []).map((r: Record<string, unknown>) => ({
            title: (r.title as string) || "",
            description: (r.description as string) || "",
            titleEn: (r.title_en as string) || "",
            descriptionEn: (r.description_en as string) || "",
            amount: r.amount as number,
            rewardType: r.reward_type as RewardInput["rewardType"],
            needsAddress: r.needs_address !== false,
            quantityTotal: (r.quantity_total as number) ?? undefined,
          })),
        });
        setSavedProjectId(p.id);
        setPreviewToken(p.preview_token || null);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "下書きを読み込めませんでした"
          );
        }
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId, user, router]);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateWithAI = async (type: string, prompt?: string) => {
    setIsGenerating(type);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          input: prompt || formData.title,
          context: formData.category,
        }),
      });

      if (!response.ok) throw new Error("生成に失敗しました");
      const data = await response.json();

      if (type === "tagline") updateField("tagline", data.result);
      else if (type === "description") updateField("description", data.result);
      else if (type === "story") updateField("story", data.result);

      toast.success("下書きを作成しました。自由に編集してください");
    } catch {
      toast.error("下書きの生成に失敗しました。時間をおいてもう一度お試しください");
    } finally {
      setIsGenerating(null);
    }
  };

  const addReward = () => {
    setFormData((prev) => ({
      ...prev,
      rewards: [
        ...prev.rewards,
        {
          title: "",
          description: "",
          titleEn: "",
          descriptionEn: "",
          amount: 1000,
          rewardType: "physical" as const,
          needsAddress: true,
        },
      ],
    }));
  };

  const updateReward = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  };

  const removeReward = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => {
      const last = prev.milestones[prev.milestones.length - 1];
      const nextAmount = last ? last.amount + 50000 : 50000;
      return {
        ...prev,
        milestones: [
          ...prev.milestones,
          { amount: nextAmount, title: "", description: "" },
        ],
      };
    });
  };

  const updateMilestone = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  // 有効な段階（金額>0かつタイトルあり）を金額昇順で
  const validMilestones = () =>
    formData.milestones
      .filter((m) => Number(m.amount) > 0 && m.title.trim())
      .sort((a, b) => a.amount - b.amount);

  /**
   * 「次へ」を押せない理由。押せるときは null。
   * 無効にするだけだと、金額なのか達成内容なのか分からず手が止まる。
   */
  // 入力中は末尾のハイフンを許しているので、確定形（API と同じ正規化）で判定する。
  // 空欄なら自動生成に任せるため見ない。
  const finalSlug = normalizeSlug(formData.slug);
  const slugIssue = finalSlug ? slugError(finalSlug) : null;

  const nextBlockedReason = (): string | null => {
    switch (currentStep) {
      case 1:
        if (formData.title.trim().length < 5)
          return "タイトルを5文字以上で入力してください";
        if (!formData.category) return "カテゴリーを選んでください";
        if (slugIssue) return slugIssue;
        return null;
      case 2:
        if (formData.description.length < 50)
          return `プロジェクト概要をあと${
            50 - formData.description.length
          }文字入力してください`;
        return null;
      case 3: {
        const valid = validMilestones();
        if (valid.length === 0) {
          // 金額だけ入れて達成内容が空、というのがいちばん多い
          return formData.milestones.some((m) => Number(m.amount) > 0)
            ? "段階ゴールの達成内容を入力してください"
            : "第1目標の金額と達成内容を入力してください";
        }
        if (valid[0].amount < MIN_GOAL_AMOUNT)
          return `第1目標は¥${MIN_GOAL_AMOUNT.toLocaleString()}以上で設定してください`;
        if (!formData.endDate) return "掲載終了日を選んでください";
        return null;
      }
      default:
        return null;
    }
  };

  const canGoNext = () => nextBlockedReason() === null;

  const buildPayload = (mode: "draft" | "submit") => ({
    mode,
    projectId: savedProjectId ?? undefined,
    title: formData.title,
    tagline: formData.tagline || formData.title,
    slug: formData.slug,
    description: formData.description,
    story: formData.story,
    titleEn: formData.titleEn,
    taglineEn: formData.taglineEn,
    descriptionEn: formData.descriptionEn,
    storyEn: formData.storyEn,
    categoryId: formData.category,
    tags: [],
    goalAmount: validMilestones()[0]?.amount ?? 0,
    milestones: validMilestones(),
    endDate: formData.endDate,
    mainImageUrl: formData.mainImageUrl,
    images: formData.images,
    allowFreeAmount: formData.allowFreeAmount,
    allowComments: formData.allowComments,
    rewards: formData.rewards,
    faqs: formData.faqs,
    theme: formData.theme,
  });

  // 下書き保存（作成/更新）。保存したプロジェクトIDとプレビュートークンを返す。
  const saveDraft = async (
    opts: { silent?: boolean } = {}
  ): Promise<{ id: string; token: string } | null> => {
    if (!user) return null;
    setIsSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("draft")),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      const id = data.project.id as string;
      const token = data.project.preview_token as string;
      setSavedProjectId(id);
      setPreviewToken(token);
      if (!opts.silent) toast.success("下書きを保存しました");
      return { id, token };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // 実際の掲載画面を別窓でプレビュー（保存してからトークンURLを開く）
  const handlePreview = async () => {
    // ポップアップブロック回避のため、クリック直後に同期で空タブを開く
    const win = window.open("", "_blank");
    setIsPreviewing(true);
    try {
      // 最新内容を下書き保存（保存済みなら更新）
      const saved = await saveDraft({ silent: true });
      if (saved?.token) {
        const url = `/projects/preview/${saved.token}`;
        if (win) win.location.href = url;
        else window.open(url, "_blank", "noopener");
      } else {
        if (win) win.close();
        toast.error("プレビューの準備に失敗しました。もう一度お試しください。");
      }
    } catch {
      if (win) win.close();
      toast.error("プレビューの準備に失敗しました。もう一度お試しください。");
    } finally {
      setIsPreviewing(false);
    }
  };

  const previewUrl =
    previewToken && typeof window !== "undefined"
      ? `${window.location.origin}/projects/preview/${previewToken}`
      : "";

  const copyPreviewLink = async () => {
    if (!previewUrl) {
      const saved = await saveDraft({ silent: true });
      if (!saved) return;
      await navigator.clipboard.writeText(
        `${window.location.origin}/projects/preview/${saved.token}`
      );
    } else {
      await navigator.clipboard.writeText(previewUrl);
    }
    toast.success("関係者プレビューリンクをコピーしました");
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("submit")),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "プロジェクト作成に失敗しました");
      }
      toast.success("プロジェクトを申請しました。運営の確認後に掲載されます");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 pt-24 pb-12 px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-white p-8 text-center">
          <h1
            className="text-2xl font-bold text-ink mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ログインが必要です
          </h1>
          <p className="text-sm text-ink-soft mb-8 leading-relaxed">
            プロジェクトを作成するには、ログインが必要です。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push("/auth/login?redirect=/projects/create")}
            >
              ログイン / 新規登録
            </Button>
            <Button variant="outline" onClick={() => router.push("/projects")}>
              プロジェクトを見る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 掲載は運営が承認したアカウントのみ
  if (!isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 pt-24 pb-12 px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-white p-8 text-center">
          <h1
            className="text-2xl font-bold text-ink mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            掲載には運営の承認が必要です
          </h1>
          <p className="text-sm text-ink-soft mb-8 leading-relaxed">
            プロジェクトの掲載は、運営が内容を確認したアカウントのみが行えます。
            掲載をご希望の事務所・レーベルの方は、
            <Link
              href="/apply"
              className="font-bold text-ink underline underline-offset-4 decoration-line-strong hover:decoration-ink"
            >
              掲載の申し込み
            </Link>
            からご連絡ください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push("/projects")}>
              プロジェクトを見る
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              マイページへ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-muted">下書きを読み込み中...</p>
        </div>
      </div>
    );
  }

  const current = steps[currentStep - 1];
  const fieldClass =
    "h-11 rounded-lg border border-line-strong bg-white text-ink placeholder:text-ink-faint outline-none hover:border-ink-faint focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors";
  const aiButtonClass =
    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line-strong bg-white text-xs font-bold text-ink-soft hover:bg-cream-100 hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <header className="pt-4 pb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold text-ink mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            プロジェクトを作成
          </h1>
          <p className="text-sm text-ink-muted">
            6つのステップで入力します。途中で下書き保存して、あとから続きを編集できます。
          </p>
        </header>

        {/* ステッパー */}
        <nav aria-label="作成ステップ" className="mb-8">
          <p className="text-xs font-bold text-ink-muted mb-2 sm:hidden">
            ステップ {currentStep} / {steps.length}・{current?.title}
          </p>
          <ol className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {steps.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <li key={step.id} aria-current={active ? "step" : undefined}>
                  <div
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      done || active ? "bg-ink" : "bg-line"
                    )}
                  />
                  <p
                    className={cn(
                      "hidden sm:flex items-center gap-1 mt-2 text-xs",
                      active
                        ? "font-bold text-ink"
                        : done
                        ? "text-ink-soft"
                        : "text-ink-faint"
                    )}
                  >
                    {done ? (
                      <Check size={12} className="flex-shrink-0" />
                    ) : (
                      <span className="tabular-nums">{step.id}</span>
                    )}
                    <span className="truncate">{step.title}</span>
                  </p>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ステップコンテンツ */}
        <div key={currentStep} className="animate-fade-in">
          {/* STEP 1: 基本情報 */}
          {currentStep === 1 && (
            <Card className="rounded-xl">
              <StepHeading>基本情報</StepHeading>

              <div className="space-y-6">
                <Input
                  label="プロジェクトタイトル"
                  placeholder="例：香りで楽しむ音楽アルバムを作りたい"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  hint="プロジェクトページで最初に目に入るタイトルです"
                  fullWidth
                />

                <div>
                  <p className="text-sm font-bold text-ink mb-1.5">
                    タグライン
                    <span className="text-xs text-ink-muted font-normal ml-2">
                      プロジェクトを一文で表す短い説明
                    </span>
                  </p>
                  <Textarea
                    placeholder="例：音楽と香りを組み合わせたリスニング体験"
                    value={formData.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    rows={2}
                    fullWidth
                  />
                  <button
                    onClick={() => generateWithAI("tagline")}
                    disabled={!formData.title || isGenerating === "tagline"}
                    className={cn(aiButtonClass, "mt-2")}
                  >
                    {isGenerating === "tagline" ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 size={12} />
                        AIで下書きを作る
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <Input
                    label="公開URL（任意）"
                    placeholder="例：scent-music-album"
                    value={formData.slug}
                    onChange={(e) =>
                      updateField("slug", normalizeSlugInput(e.target.value))
                    }
                    error={slugIssue ?? undefined}
                    fullWidth
                    hint="半角英数字とハイフン。空欄ならこちらで決めます。公開後は変更できません"
                  />
                  <p className="text-xs text-ink-muted mt-1.5 break-all">
                    {SITE_HOST}/projects/
                    <span className="font-bold text-ink">
                      {finalSlug || "（自動）"}
                    </span>
                  </p>
                </div>

                <EnglishPanel
                  hasContent={Boolean(formData.titleEn || formData.taglineEn)}
                >
                  <Input
                    label="Title"
                    placeholder="e.g. A music album you can enjoy with scent"
                    value={formData.titleEn}
                    onChange={(e) => updateField("titleEn", e.target.value)}
                    fullWidth
                  />
                  <Textarea
                    label="Tagline"
                    placeholder="e.g. A brand-new listening experience blending music and scent"
                    value={formData.taglineEn}
                    onChange={(e) => updateField("taglineEn", e.target.value)}
                    rows={2}
                    fullWidth
                  />
                </EnglishPanel>

                <div>
                  <p className="text-sm font-bold text-ink mb-2">カテゴリー</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => updateField("category", cat.slug)}
                        aria-pressed={formData.category === cat.slug}
                        className={cn(
                          "h-11 px-4 rounded-lg border text-sm font-semibold text-left transition-colors",
                          formData.category === cat.slug
                            ? "border-ink bg-ink text-white"
                            : "border-line-strong bg-white text-ink-soft hover:bg-cream-50"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: プロジェクト詳細 */}
          {currentStep === 2 && (
            <Card className="rounded-xl">
              <StepHeading>プロジェクトの詳細</StepHeading>

              <div className="space-y-6">
                <ProjectImagePicker
                  mainImageUrl={formData.mainImageUrl}
                  images={formData.images}
                  onChange={(next) =>
                    setFormData((prev) => ({
                      ...prev,
                      mainImageUrl: next.mainImageUrl,
                      images: next.images,
                    }))
                  }
                />

                <div className="h-px bg-line" />

                <p className="text-xs text-ink-muted leading-relaxed">
                  「AIで下書きを作る」を押すと、タイトルとカテゴリーをもとに文章の下書きを作ります。生成後に自由に編集できます。
                </p>

                <MarkdownEditor
                  label="プロジェクト概要"
                  labelExtra={
                    <button
                      onClick={() => generateWithAI("description")}
                      disabled={isGenerating === "description"}
                      className={aiButtonClass}
                    >
                      {isGenerating === "description" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      {isGenerating === "description" ? "生成中..." : "AIで下書きを作る"}
                    </button>
                  }
                  placeholder="何を作りたいのか、なぜそれをしたいのか、誰に届けたいのかを書いてください。"
                  value={formData.description}
                  onChange={(v) => updateField("description", v)}
                  rows={10}
                  allowImages
                  hint={`${formData.description.length}文字（最低50文字）・見出しや箇条書きで区切ると読みやすくなります`}
                />

                <MarkdownEditor
                  label="ストーリー（任意）"
                  labelExtra={
                    <button
                      onClick={() => generateWithAI("story")}
                      disabled={isGenerating === "story"}
                      className={aiButtonClass}
                    >
                      {isGenerating === "story" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      {isGenerating === "story" ? "生成中..." : "AIで下書きを作る"}
                    </button>
                  }
                  placeholder="このプロジェクトを始めたきっかけや、込めた想いを書いてください。"
                  value={formData.story}
                  onChange={(v) => updateField("story", v)}
                  rows={8}
                  allowImages
                />

                <EnglishPanel
                  hasContent={Boolean(
                    formData.descriptionEn || formData.storyEn
                  )}
                >
                  <MarkdownEditor
                    label="Project overview"
                    placeholder="Describe your project in English."
                    value={formData.descriptionEn}
                    onChange={(v) => updateField("descriptionEn", v)}
                    rows={8}
                    allowImages
                  />
                  <MarkdownEditor
                    label="Story"
                    placeholder="Tell your story in English."
                    value={formData.storyEn}
                    onChange={(v) => updateField("storyEn", v)}
                    rows={6}
                    allowImages
                  />
                </EnglishPanel>

                <div className="pt-6 border-t border-line">
                  <FaqEditor
                    items={formData.faqs}
                    onChange={(faqs) => updateField("faqs", faqs)}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: 目標・期間 */}
          {currentStep === 3 && (
            <Card className="rounded-xl">
              <StepHeading>段階ゴールと掲載期間</StepHeading>
              <p className="text-sm text-ink-muted leading-relaxed -mt-3 mb-6">
                金額の少ない段階から順に設定します。達成した段階まで実施され、最小額が「第1目標」になります。
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
                    <p className="text-sm font-bold text-ink">段階ゴール</p>
                    <span className="text-xs text-ink-muted">
                      例：¥50,000 フラスタ → ¥100,000 新衣装 → ¥150,000 新曲
                    </span>
                  </div>

                  <ol className="rounded-lg border border-line divide-y divide-line">
                    {formData.milestones.map((m, i) => (
                      <li key={i} className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-ink-muted">
                            {i === 0 ? "第1目標" : `第${i + 1}段階`}
                          </span>
                          {formData.milestones.length > 1 && (
                            <button
                              onClick={() => removeMilestone(i)}
                              className="p-1.5 rounded-md text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label="この段階を削除"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <div className="relative w-32 sm:w-36 flex-shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-muted text-sm">
                              ¥
                            </span>
                            <input
                              type="number"
                              value={m.amount || ""}
                              onChange={(e) => updateMilestone(i, "amount", parseInt(e.target.value) || 0)}
                              placeholder="50000"
                              className={cn(fieldClass, "w-full pl-7 pr-2 font-bold tabular-nums")}
                            />
                          </div>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => updateMilestone(i, "title", e.target.value)}
                            placeholder="達成内容（例：フラスタ）"
                            className={cn(fieldClass, "flex-1 min-w-0 px-3")}
                          />
                        </div>
                        <input
                          type="text"
                          value={m.description || ""}
                          onChange={(e) => updateMilestone(i, "description", e.target.value)}
                          placeholder="補足説明（任意）"
                          className={cn(fieldClass, "w-full mt-2 px-3 text-sm")}
                        />
                      </li>
                    ))}
                  </ol>

                  <button
                    onClick={addMilestone}
                    className="w-full mt-3 h-11 rounded-lg border border-dashed border-line-strong text-sm font-bold text-ink-soft hover:bg-cream-50 hover:text-ink transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    段階を追加する
                  </button>
                  <p className="text-xs text-ink-muted mt-2">
                    第1目標は¥{MIN_GOAL_AMOUNT.toLocaleString()}
                    以上。各段階は金額と達成内容の両方が必要です。
                  </p>
                </div>

                <Input
                  label="掲載終了日"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  min={jstDateAfterDays(7)}
                  fullWidth
                  hint="最短7日・最長90日"
                />

                {/* 手数料の説明 */}
                <div className="px-4 py-3.5 rounded-lg bg-cream-100">
                  <p className="text-sm font-bold text-ink mb-1">
                    掲載者の手数料は0円です
                  </p>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    CaramYellは掲載者から手数料をいただきません。
                    支援者側に{BACKER_FEE_PERCENT}%の手数料が上乗せされる仕組みです。
                  </p>
                  <p className="text-xs text-ink-muted mt-1 tabular-nums">
                    例：¥{FEE_EXAMPLE.baseText}のリターンを選んだ支援者は ¥{FEE_EXAMPLE.totalText} をお支払いいただきます
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: リターン設定 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card className="rounded-xl">
                <StepHeading>リターン</StepHeading>
                <p className="text-sm text-ink-muted leading-relaxed -mt-3 mb-4">
                  支援者へのお礼を設定します。種類は次の3つから選べます。
                </p>

                <dl className="grid grid-cols-3 rounded-lg border border-line divide-x divide-line mb-6">
                  {[
                    { label: "物品", desc: "グッズ等" },
                    { label: "デジタル", desc: "ボイス・画像・動画" },
                    { label: "体験", desc: "イベント・特典" },
                  ].map((t) => (
                    <div key={t.label} className="px-3 py-2.5 min-w-0">
                      <dt className="text-xs font-bold text-ink">{t.label}</dt>
                      <dd className="text-xs text-ink-muted">{t.desc}</dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-lg border border-line divide-y divide-line">
                  {/* 金額自由の応援（リターンなし）を受け付けるか */}
                  <ToggleRow
                    checked={formData.allowFreeAmount}
                    onToggle={() => updateField("allowFreeAmount", !formData.allowFreeAmount)}
                    title="金額自由の応援（リターンなし）を受け付ける"
                    description="オンにすると、支援者が好きな金額でリターンなしの応援ができます。"
                  />

                  {/* コメント欄の有無 */}
                  <ToggleRow
                    checked={formData.allowComments}
                    onToggle={() => updateField("allowComments", !formData.allowComments)}
                    title="コメント欄を設置する"
                    description="オンにすると、支援者がプロジェクトページにコメントを投稿できます。"
                  />
                </div>
              </Card>

              {formData.rewards.map((reward, i) => (
                <RewardForm
                  key={i}
                  reward={reward}
                  index={i}
                  onChange={(field, value) => updateReward(i, field, value)}
                  onRemove={() => removeReward(i)}
                />
              ))}

              <button
                onClick={addReward}
                className="w-full h-12 rounded-xl border border-dashed border-line-strong bg-white text-sm font-bold text-ink-soft hover:bg-cream-50 hover:text-ink transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                リターンを追加する
              </button>

              {formData.rewards.length === 0 && (
                <p className="text-center text-sm text-ink-muted pb-2">
                  リターンなしでも掲載できます（応援のみ）
                </p>
              )}
            </div>
          )}

          {/* STEP 5: デザイン */}
          {currentStep === 5 && (
            <div>
              <Card className="rounded-xl mb-6">
                <StepHeading>ページのデザイン</StepHeading>
                <p className="text-sm text-ink-muted leading-relaxed -mt-3">
                  プロジェクトページの配色とフォントです。あとから何度でも変えられるので、
                  迷ったらそのままで大丈夫です。
                </p>
              </Card>

              <ThemeEditor
                theme={formData.theme}
                onChange={(theme) => updateField("theme", theme)}
                preview={{
                  title: formData.title,
                  tagline: formData.tagline || formData.title,
                  imageUrl: formData.mainImageUrl,
                  goalAmount: validMilestones()[0]?.amount ?? 0,
                }}
              />
            </div>
          )}

          {/* STEP 6: 確認 */}
          {currentStep === 6 && (
            <Card className="rounded-xl">
              <StepHeading>内容の確認と申請</StepHeading>

              <dl className="divide-y divide-line border-y border-line">
                <ReviewItem label="タイトル" value={formData.title || "（未入力）"} />
                <ReviewItem
                  label="公開URL"
                  value={
                    finalSlug
                      ? `${SITE_HOST}/projects/${finalSlug}`
                      : "（自動で決まります）"
                  }
                />
                <ReviewItem label="カテゴリー" value={categories.find(c => c.slug === formData.category)?.name || "（未選択）"} />
                <ReviewItem label="タグライン" value={formData.tagline || "（未入力）"} />
                <ReviewItem
                  label="第1目標"
                  value={
                    validMilestones()[0]
                      ? `¥${validMilestones()[0].amount.toLocaleString()}`
                      : "（未設定）"
                  }
                />
                <div className="py-3">
                  <dt className="text-sm text-ink-muted mb-2">段階ゴール</dt>
                  <dd>
                    {validMilestones().length > 0 ? (
                      <ol className="space-y-1">
                        {validMilestones().map((m, i) => (
                          <li key={i} className="flex justify-between gap-3 text-sm">
                            <span className="text-ink-soft min-w-0">
                              {i + 1}. {m.title}
                            </span>
                            <span className="font-bold text-ink tabular-nums">
                              ¥{m.amount.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <span className="text-sm font-bold text-ink">（未設定）</span>
                    )}
                  </dd>
                </div>
                <ReviewItem label="掲載終了日" value={formData.endDate || "（未設定）"} />
                <ReviewItem label="リターン数" value={`${formData.rewards.length}種類`} />
              </dl>

              <div className="mt-6 px-4 py-3.5 rounded-lg bg-cream-100">
                <p className="text-sm font-bold text-ink mb-2">申請後の流れ</p>
                <ol className="space-y-1 text-sm text-ink-soft list-decimal list-inside">
                  <li>申請が完了します</li>
                  <li>運営が内容を確認します</li>
                  <li>確認が済むと掲載が始まります</li>
                </ol>
              </div>

              {/* プレビュー・関係者リンク */}
              <section className="mt-6 rounded-lg border border-line p-4 space-y-4">
                <div>
                  <p className="text-sm font-bold text-ink mb-2">
                    公開前に見え方を確認
                  </p>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handlePreview}
                    disabled={isPreviewing || isSaving}
                    icon={<ExternalLink size={16} />}
                  >
                    {isPreviewing ? "準備中..." : "実際の掲載画面を別窓でプレビュー"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-line">
                  <p className="text-xs font-bold text-ink-muted mb-1.5 flex items-center gap-1.5">
                    <Link2 size={14} />
                    関係者プレビューリンク
                  </p>
                  {previewToken ? (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={previewUrl}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-line-strong bg-cream-50 text-xs text-ink-soft outline-none"
                      />
                      <Button
                        variant="outline"
                        onClick={copyPreviewLink}
                        icon={<Copy size={14} />}
                        className="flex-shrink-0"
                      >
                        コピー
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={copyPreviewLink}
                      disabled={isSaving}
                      icon={<Link2 size={14} />}
                    >
                      リンクを発行してコピー
                    </Button>
                  )}
                  <p className="text-[11px] text-ink-muted mt-1.5">
                    ログイン不要で閲覧できます。未公開の内容なので共有先にご注意ください。
                  </p>
                </div>
              </section>

              <Button
                fullWidth
                size="xl"
                onClick={handleSubmit}
                className="mt-6"
              >
                プロジェクトを申請する
              </Button>

              <p className="text-xs text-center text-ink-muted mt-3">
                申請後も内容は編集できます
              </p>
            </Card>
          )}
        </div>

        {/* ナビゲーションボタン */}
        {currentStep < steps.length && nextBlockedReason() && (
          <div className="flex items-start gap-2 mt-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <Info size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {nextBlockedReason()}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-6">
          <Button
            variant="ghost"
            icon={<ChevronLeft size={16} />}
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            戻る
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => saveDraft()}
              disabled={isSaving}
              icon={<Save size={16} />}
            >
              {isSaving ? "保存中..." : "下書き保存"}
            </Button>

            {currentStep < steps.length ? (
              <Button
                icon={<ChevronRight size={16} />}
                iconPosition="right"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canGoNext()}
              >
                次へ
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold text-ink mb-6"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h2>
  );
}

function ToggleRow({
  checked,
  onToggle,
  title,
  description,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-cream-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-ink text-sm">{title}</p>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
      <span
        className={cn(
          "relative w-10 h-6 rounded-full flex-shrink-0 transition-colors",
          checked ? "bg-ink" : "bg-line-strong"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}

function RewardForm({
  reward,
  index,
  onChange,
  onRemove,
}: {
  reward: RewardInput;
  index: number;
  onChange: (field: string, value: unknown) => void;
  onRemove: () => void;
}) {
  return (
    <Card className="rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-ink">リターン {index + 1}</h3>
        <button
          onClick={onRemove}
          aria-label="このリターンを削除"
          className="p-1.5 rounded-md text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "physical", label: "物品", needsAddress: true },
            { value: "digital", label: "デジタル", needsAddress: false },
            { value: "experience", label: "体験", needsAddress: false },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => {
                onChange("rewardType", t.value);
                onChange("needsAddress", t.needsAddress);
              }}
              aria-pressed={reward.rewardType === t.value}
              className={cn(
                "h-10 rounded-lg text-xs font-bold border transition-colors",
                reward.rewardType === t.value
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong bg-white text-ink-soft hover:bg-cream-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Input
          label="タイトル"
          placeholder="例：限定お礼ボイス＋デジタルアルバム"
          value={reward.title}
          onChange={(e) => onChange("title", e.target.value)}
          fullWidth
        />

        <Textarea
          label="説明"
          placeholder="このリターンの詳細を説明してください"
          value={reward.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          fullWidth
        />

        <EnglishPanel
          hasContent={Boolean(reward.titleEn || reward.descriptionEn)}
        >
          <Input
            label="Title"
            placeholder="e.g. Limited thank-you voice message + digital album"
            value={reward.titleEn}
            onChange={(e) => onChange("titleEn", e.target.value)}
            fullWidth
          />
          <Textarea
            label="Description"
            placeholder="Describe this reward in English"
            value={reward.descriptionEn}
            onChange={(e) => onChange("descriptionEn", e.target.value)}
            rows={3}
            fullWidth
          />
        </EnglishPanel>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="金額（円）"
            type="number"
            value={reward.amount.toString()}
            onChange={(e) => onChange("amount", parseInt(e.target.value) || 0)}
            fullWidth
          />
          <Input
            label="数量制限（任意）"
            type="number"
            placeholder="無制限"
            value={reward.quantityTotal?.toString() || ""}
            onChange={(e) => onChange("quantityTotal", e.target.value ? parseInt(e.target.value) : undefined)}
            fullWidth
          />
        </div>

        {reward.rewardType !== "digital" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reward.needsAddress}
              onChange={(e) => onChange("needsAddress", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-ink-soft">住所入力が必要</span>
          </label>
        )}
      </div>
    </Card>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted flex-shrink-0">{label}</dt>
      <dd className="text-sm font-bold text-ink text-right min-w-0 break-words max-w-[65%]">{value}</dd>
    </div>
  );
}
