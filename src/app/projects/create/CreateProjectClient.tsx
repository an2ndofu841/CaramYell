"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Wand2,
  Check,
  Info,
  Upload,
  Calendar,
  DollarSign,
  Package,
  Smartphone,
  Star,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  { slug: "music", name: "音楽", icon: "🎵" },
  { slug: "art", name: "アート", icon: "🎨" },
  { slug: "game", name: "ゲーム", icon: "🎮" },
  { slug: "tech", name: "テクノロジー", icon: "💻" },
  { slug: "video", name: "動画・映像", icon: "🎬" },
  { slug: "food", name: "フード", icon: "🍽️" },
  { slug: "fashion", name: "ファッション", icon: "👗" },
  { slug: "photo", name: "写真", icon: "📸" },
  { slug: "social", name: "社会・コミュニティ", icon: "🌍" },
  { slug: "other", name: "その他", icon: "✨" },
];

const steps = [
  { id: 1, title: "基本情報", icon: "📝" },
  { id: 2, title: "プロジェクト詳細", icon: "📖" },
  { id: 3, title: "目標・期間", icon: "🎯" },
  { id: 4, title: "リターン設定", icon: "🎁" },
  { id: 5, title: "確認・送信", icon: "🚀" },
];

type RewardInput = {
  title: string;
  description: string;
  amount: number;
  rewardType: "physical" | "digital" | "experience" | "no_reward";
  needsAddress: boolean;
  quantityTotal?: number;
};

export default function CreateProjectClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    category: "",
    description: "",
    story: "",
    goalAmount: 500000,
    endDate: "",
    rewards: [] as RewardInput[],
  });

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

      toast.success("AIが生成しました！✨ 自由に編集してください");
    } catch {
      toast.error("AI生成に失敗しました。後でもう一度お試しください。");
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

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return formData.title.length >= 5 && formData.category;
      case 2: return formData.description.length >= 50;
      case 3: return formData.goalAmount >= 10000 && formData.endDate;
      case 4: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          tagline: formData.tagline || formData.title,
          description: formData.description,
          story: formData.story,
          categoryId: formData.category,
          tags: [],
          goalAmount: formData.goalAmount,
          endDate: formData.endDate,
          rewards: formData.rewards,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "プロジェクト作成に失敗しました");
      }
      toast.success("プロジェクトを申請しました！審査は最短30分で完了します");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-caramel-200 border-t-candy-pink animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4" style={{ background: "linear-gradient(135deg, #FFFBF5 0%, #FFF5E6 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-candy"
            style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            ログインが必要です
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            プロジェクトを作成するには、アカウント登録またはログインが必要です。
            <br />
            <span className="text-sm">無料でかんたんに登録できます。</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/auth/login?redirect=/projects/create")}
              className="px-8 py-3 rounded-full text-white font-bold btn-pop"
              style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)", boxShadow: "0 4px 20px rgba(255, 107, 157, 0.4)" }}
            >
              ログイン / 新規登録
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="px-8 py-3 rounded-full font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors"
            >
              プロジェクトを見る
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 100%)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center py-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-candy"
            style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}
          >
            🚀
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            プロジェクトを作る
          </h1>
          <p className="text-gray-500">
            AIのサポートで、最短10分でページ完成 ✨
          </p>
        </div>

        {/* ステッパー */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-caramel-100 -z-10" />
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    step.id < currentStep
                      ? "text-white shadow-sm"
                      : step.id === currentStep
                      ? "text-white shadow-candy"
                      : "bg-white text-gray-400 border-2 border-caramel-100"
                  )}
                  style={
                    step.id <= currentStep
                      ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
                      : {}
                  }
                  animate={{ scale: step.id === currentStep ? 1.1 : 1 }}
                >
                  {step.id < currentStep ? (
                    <Check size={16} />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </motion.div>
                <span className={cn(
                  "text-xs font-semibold hidden sm:block",
                  step.id === currentStep ? "text-caramel-600" : "text-gray-400"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ステップコンテンツ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: 基本情報 */}
            {currentStep === 1 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  📝 基本情報を入力
                </h2>

                <div className="space-y-6">
                  <Input
                    label="プロジェクトタイトル"
                    placeholder="例：世界で初めての香りで楽しむ音楽アルバムを作りたい！"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    hint="ユーザーが最初に見るタイトルです。魅力的に！"
                    fullWidth
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      タグライン
                      <span className="text-xs text-gray-400 font-normal ml-2">
                        プロジェクトを一文で表す短い説明
                      </span>
                    </p>
                    <div className="relative">
                      <Textarea
                        placeholder="例：音楽と香りを融合させた、全く新しいリスニング体験"
                        value={formData.tagline}
                        onChange={(e) => updateField("tagline", e.target.value)}
                        rows={2}
                        fullWidth
                      />
                      <button
                        onClick={() => generateWithAI("tagline")}
                        disabled={!formData.title || isGenerating === "tagline"}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-pop"
                        style={{ background: "linear-gradient(135deg, #C3B1E1, #74C0FC)" }}
                      >
                        {isGenerating === "tagline" ? (
                          <>⏳ 生成中...</>
                        ) : (
                          <>
                            <Wand2 size={14} />
                            AIで生成する
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      カテゴリー
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => updateField("category", cat.slug)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all duration-200",
                            formData.category === cat.slug
                              ? "text-white border-transparent shadow-sm"
                              : "border-caramel-100 text-gray-600 hover:border-caramel-200 bg-white"
                          )}
                          style={
                            formData.category === cat.slug
                              ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
                              : {}
                          }
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 2: プロジェクト詳細 */}
            {currentStep === 2 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  📖 プロジェクトを詳しく説明する
                </h2>

                <div className="space-y-6">
                  {/* AI生成バナー */}
                  <div className="p-4 rounded-2xl flex items-start gap-3"
                    style={{ background: "linear-gradient(135deg, rgba(195, 177, 225, 0.1), rgba(116, 192, 252, 0.1))", border: "1px solid rgba(195, 177, 225, 0.3)" }}>
                    <Sparkles size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        AIがあなたのプロジェクトを説明します！
                      </p>
                      <p className="text-xs text-gray-500">
                        タイトルとカテゴリーをもとに、AIが説明文を自動生成します。
                        生成後、自由に編集できます。
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">プロジェクト概要</p>
                      <button
                        onClick={() => generateWithAI("description")}
                        disabled={isGenerating === "description"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-50 btn-pop"
                        style={{ background: "linear-gradient(135deg, #C3B1E1, #74C0FC)" }}
                      >
                        <Wand2 size={12} />
                        {isGenerating === "description" ? "生成中..." : "AIで生成"}
                      </button>
                    </div>
                    <Textarea
                      placeholder="プロジェクトについて詳しく説明してください。何を作りたいのか、なぜそれをしたいのか、誰に届けたいのかを書きましょう。"
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={8}
                      fullWidth
                      hint={`${formData.description.length}文字（最低50文字）`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">
                        ストーリー
                        <span className="text-xs text-gray-400 font-normal ml-1">（任意）</span>
                      </p>
                      <button
                        onClick={() => generateWithAI("story")}
                        disabled={isGenerating === "story"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-50 btn-pop"
                        style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}
                      >
                        <Wand2 size={12} />
                        {isGenerating === "story" ? "生成中..." : "AIで生成"}
                      </button>
                    </div>
                    <Textarea
                      placeholder="このプロジェクトを始めたきっかけや、あなたの想いを書きましょう。"
                      value={formData.story}
                      onChange={(e) => updateField("story", e.target.value)}
                      rows={6}
                      fullWidth
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 3: 目標・期間 */}
            {currentStep === 3 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  🎯 目標金額と掲載期間
                </h2>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      目標金額（円）
                    </p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">¥</span>
                      <input
                        type="number"
                        value={formData.goalAmount}
                        onChange={(e) => updateField("goalAmount", parseInt(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-caramel-100 text-gray-800 text-lg font-bold outline-none focus:border-candy-pink transition-colors"
                      />
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[100000, 300000, 500000, 1000000, 3000000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => updateField("goalAmount", amount)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                            formData.goalAmount === amount
                              ? "text-white"
                              : "bg-caramel-50 text-caramel-600 hover:bg-caramel-100"
                          )}
                          style={formData.goalAmount === amount ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" } : {}}
                        >
                          ¥{amount.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="掲載終了日"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                    fullWidth
                    hint="最短7日・最長90日"
                  />

                  {/* 手数料の説明 */}
                  <div className="p-4 rounded-2xl bg-green-50 border-2 border-green-100">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <p className="font-bold text-green-700 mb-1">掲載者の手数料は完全0円！</p>
                        <p className="text-sm text-green-600">
                          CaramYellは掲載者への手数料を一切いただきません。
                          出資者側に10%の手数料が上乗せされる仕組みです。
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          例：¥3,000のリターンを選んだ出資者は ¥3,300 をお支払いいただきます
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 4: リターン設定 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    🎁 リターンを設定する
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    支援者へのお礼を設定しましょう。デジタルコンテンツも設定できます。
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { type: "physical", icon: <Package size={20} />, label: "物品", desc: "グッズ等" },
                      { type: "digital", icon: <Smartphone size={20} />, label: "デジタル", desc: "ボイス・画像・動画" },
                      { type: "experience", icon: <Star size={20} />, label: "体験", desc: "イベント・特典" },
                    ].map((t) => (
                      <div key={t.type} className="text-center p-3 rounded-2xl bg-caramel-50">
                        <div className="text-caramel-500 mx-auto mb-1 flex justify-center">{t.icon}</div>
                        <p className="text-xs font-bold text-gray-700">{t.label}</p>
                        <p className="text-xs text-gray-400">{t.desc}</p>
                      </div>
                    ))}
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
                  className="w-full py-4 rounded-3xl border-2 border-dashed border-caramel-200 text-caramel-500 font-bold hover:border-caramel-300 hover:bg-caramel-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  リターンを追加する
                </button>

                {formData.rewards.length === 0 && (
                  <p className="text-center text-sm text-gray-400 pb-2">
                    リターンなしでも掲載できます（応援のみ）
                  </p>
                )}
              </div>
            )}

            {/* STEP 5: 確認 */}
            {currentStep === 5 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  🚀 内容を確認して申請する
                </h2>

                <div className="space-y-4">
                  <ReviewItem label="タイトル" value={formData.title || "（未入力）"} />
                  <ReviewItem label="カテゴリー" value={categories.find(c => c.slug === formData.category)?.name || "（未選択）"} />
                  <ReviewItem label="タグライン" value={formData.tagline || "（未入力）"} />
                  <ReviewItem label="目標金額" value={`¥${formData.goalAmount.toLocaleString()}`} />
                  <ReviewItem label="掲載終了日" value={formData.endDate || "（未設定）"} />
                  <ReviewItem label="リターン数" value={`${formData.rewards.length}種類`} />

                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-100 mt-6">
                    <div className="flex gap-3">
                      <Info size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <p className="font-bold mb-1">申請後の流れ</p>
                        <ul className="space-y-1 text-xs">
                          <li>✅ 申請完了（即時）</li>
                          <li>⏱️ 審査（最短30分）</li>
                          <li>🎉 掲載開始（審査通過後）</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    size="xl"
                    onClick={handleSubmit}
                    icon={<Sparkles size={20} />}
                    className="mt-4"
                  >
                    プロジェクトを申請する（無料）
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    申請後も内容は編集できます
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ナビゲーションボタン */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            icon={<ChevronLeft size={18} />}
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            戻る
          </Button>

          {currentStep < steps.length ? (
            <Button
              icon={<ChevronRight size={18} />}
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
  );
}

function RewardForm({
  reward,
  index,
  onChange,
  onRemove,
}: {
  reward: {
    title: string;
    description: string;
    amount: number;
    rewardType: string;
    needsAddress: boolean;
    quantityTotal?: number;
  };
  index: number;
  onChange: (field: string, value: unknown) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="outlined">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700">リターン {index + 1}</h3>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-full text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "physical", label: "📦 物品", needsAddress: true },
              { value: "digital", label: "📱 デジタル", needsAddress: false },
              { value: "experience", label: "⭐ 体験", needsAddress: false },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  onChange("rewardType", t.value);
                  onChange("needsAddress", t.needsAddress);
                }}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold border-2 transition-all",
                  reward.rewardType === t.value
                    ? "text-white border-transparent"
                    : "border-caramel-100 text-gray-500 hover:border-caramel-200"
                )}
                style={reward.rewardType === t.value ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" } : {}}
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
              <span className="text-sm font-medium text-gray-600">住所入力が必要</span>
            </label>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-caramel-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
