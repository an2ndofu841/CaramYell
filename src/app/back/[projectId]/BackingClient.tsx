"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Star,
  User,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { calcFee, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  nextUnreached,
  resolveFinalGoal,
  splitMilestones,
} from "@/lib/project/goals";
import { toast } from "sonner";
import type { Reward, Project } from "@/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { paymentMethodBadges } from "@/lib/config/payment-methods";
import { useAuth } from "@/hooks/useAuth";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryLabel,
  getCountryFormat,
  missingAddressFields,
} from "@/lib/data/countries";

/** 1回の応援の下限。決済側（create-checkout）と同じ値にしておく */
const MIN_AMOUNT = 100;

/** 会員登録のパスワード下限。ログイン画面と同じ値にしておく */
const MIN_PASSWORD = 8;

const steps = [
  { id: 1, key: "stepReward" as const },
  { id: 2, key: "stepInfo" as const },
  { id: 3, key: "stepPayment" as const },
  { id: 4, key: "stepDone" as const },
];

export default function BackingClient({
  selectedRewardId,
  allowFreeAmount = true,
  project,
}: {
  selectedRewardId?: string;
  allowFreeAmount?: boolean;
  project: Project;
}) {
  const { t, locale, pick } = useLocale();
  const { user, signUpWithEmail } = useAuth();
  const rewards = project.rewards || [];

  const [step, setStep] = useState(1);
  // リターンごとの選択個数（カート方式）
  const [quantities, setQuantities] = useState<Record<string, number>>(
    selectedRewardId ? { [selectedRewardId]: 1 } : {}
  );
  const [freeAmount, setFreeAmount] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);

  // ついでの会員登録（任意）。支援履歴や支援者限定の活動報告を見るのに使う
  const [wantsAccount, setWantsAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  /** 登録が完了したメールアドレス。同じ内容で二重に登録しにいかないための印 */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const [guestInfo, setGuestInfo] = useState({
    nickname: "",
    email: "",
    message: "",
    address: {
      country: DEFAULT_COUNTRY,
      recipient_name: "",
      postal_code: "",
      prefecture: "",
      city: "",
      address_line1: "",
      address_line2: "",
    } as Record<string, string>,
  });

  const countryFormat = getCountryFormat(guestInfo.address.country);

  // ステップが変わったらページ先頭へ戻す（下部の「次へ」を押した位置のままだと入力しづらいため）
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ログイン中ならメールアドレスは入れ直させない。
  // このアドレスで支援が記録されると履歴にも自動で載る。
  useEffect(() => {
    if (!user?.email) return;
    setGuestInfo((p) => (p.email ? p : { ...p, email: user.email as string }));
  }, [user?.email]);

  // 在庫上限（設定があれば残数まで）
  const remainingStock = (r: Reward) =>
    r.quantity_total != null
      ? Math.max(0, r.quantity_total - (r.quantity_claimed || 0))
      : undefined;

  const setQty = (reward: Reward, qty: number) => {
    const max = remainingStock(reward);
    const capped = Math.max(0, max != null ? Math.min(qty, max) : qty);
    setQuantities((prev) => {
      const next = { ...prev };
      if (capped <= 0) delete next[reward.id];
      else next[reward.id] = capped;
      return next;
    });
  };

  const selectedItems = rewards
    .filter((r) => (quantities[r.id] || 0) > 0)
    .map((r) => ({ reward: r, qty: quantities[r.id] }));
  const rewardsTotal = selectedItems.reduce(
    (s, it) => s + it.reward.amount * it.qty,
    0
  );
  const effectiveFree = allowFreeAmount ? Math.max(0, freeAmount) : 0;
  const amount = rewardsTotal + effectiveFree;
  const needsAddress = selectedItems.some((it) => it.reward.needs_address);
  const { fee, total } = calcFee(amount);

  // 詳細ページと同じ基準で進捗を出す。段階ゴールがあれば最終目標が分母、
  // ネクストゴールは分母に入れない
  const { base: baseMilestones, stretch: stretchGoals } = splitMilestones(
    project.project_milestones
  );
  const finalGoal = resolveFinalGoal(project.goal_amount, baseMilestones);
  const nextStretch = nextUnreached(stretchGoals, project.current_amount);
  const finalReached = project.current_amount >= finalGoal;
  // 最終目標を達成したうえで未達のネクストゴールがある＝挑戦中。
  // ここで「100% 達成」だけ見せると終わったと思われて支援を止められるので、
  // ゲージをネクストゴールまで伸ばし、達成済み区間とその先を塗り分ける
  const stretchChallenging = finalReached && !!nextStretch;
  const stretchTop = stretchChallenging
    ? stretchGoals[stretchGoals.length - 1].amount
    : 0;
  const toStretchPos = (amount: number) =>
    stretchTop > 0 ? Math.min((amount / stretchTop) * 100, 100) : 0;
  const stats = {
    progress: Math.min(Math.round((project.current_amount / finalGoal) * 100), 100),
    progressUncapped: Math.round((project.current_amount / finalGoal) * 100),
    daysLeft: project.end_date
      ? Math.max(0, Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000))
      : 0,
  };

  /** 会員登録を選んでいるのにパスワードが足りていない状態 */
  const needsAccountPassword =
    wantsAccount &&
    registeredEmail !== guestInfo.email &&
    accountPassword.length < MIN_PASSWORD;

  /**
   * 「次へ」を押した時点でアカウントを作る。決済の直前だと確認メールの案内が
   * Stripe への遷移で流れてしまうので、まだ画面に留まるここで済ませる。
   * 登録に失敗しても支援自体は続けられるようにしておく。
   */
  const handleNext = async () => {
    if (step !== 2 || !wantsAccount || registeredEmail === guestInfo.email) {
      setStep((s) => s + 1);
      return;
    }

    setSigningUp(true);
    try {
      const outcome = await signUpWithEmail(guestInfo.email, accountPassword);
      switch (outcome.result) {
        case "signed_in":
        case "confirm_email":
          setRegisteredEmail(guestInfo.email);
          setAccountPassword("");
          toast.success(
            outcome.result === "signed_in"
              ? t.backing.accountCreated
              : t.backing.accountConfirmSent
          );
          break;
        case "already_registered":
          // 登録済みでも支援は止めない。ログインすれば履歴に並ぶ
          setWantsAccount(false);
          setAccountPassword("");
          toast.error(t.backing.accountExists);
          break;
        case "error":
          toast.error(outcome.message);
          return;
      }
      setStep((s) => s + 1);
    } finally {
      setSigningUp(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return amount >= MIN_AMOUNT;
    if (step === 2) {
      if (!guestInfo.email) return false;
      if (needsAccountPassword) return false;
      if (needsAddress) {
        if (!guestInfo.address.recipient_name?.trim()) return false;
        return (
          missingAddressFields(guestInfo.address.country, guestInfo.address)
            .length === 0
        );
      }
      return true;
    }
    return true;
  };

  // 郵便番号から住所を自動補完（7桁そろった時点で検索）
  const lookupPostalCode = async (raw: string) => {
    const zip = raw.replace(/[^0-9]/g, "");
    if (zip.length !== 7) return;
    setIsLookingUpZip(true);
    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`
      );
      const data = await res.json();
      const r = data?.results?.[0];
      if (!r) {
        toast.error("該当する住所が見つかりませんでした");
        return;
      }
      setGuestInfo((p) => ({
        ...p,
        address: {
          ...p.address,
          prefecture: r.address1 || "",
          // 市区町村＋町域までを自動入力（番地以降はユーザーが入力）
          city: `${r.address2 || ""}${r.address3 || ""}`,
        },
      }));
      toast.success("住所を自動入力しました");
    } catch {
      // 住所検索に失敗しても手入力できるので通知のみ
      toast.error("住所の自動入力に失敗しました。手入力してください。");
    } finally {
      setIsLookingUpZip(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Stripe Checkout へ遷移
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          items: selectedItems.map((it) => ({
            rewardId: it.reward.id,
            quantity: it.qty,
          })),
          freeAmount: effectiveFree,
          guestEmail: guestInfo.email,
          guestNickname: guestInfo.nickname,
          message: guestInfo.message,
          isAnonymous,
          guestAddress: needsAddress ? guestInfo.address : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "決済ページの作成に失敗しました");
      }
      // Stripe の決済ページへ
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "決済に失敗しました");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-20 pb-tabbar">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* 戻るリンク */}
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors font-medium py-4"
        >
          <ChevronLeft size={16} />
          {t.backing.backToProject}
        </Link>

        {/* プロジェクト概要 */}
        <Card className="mb-6">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-16 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
              <img
                src={project.main_image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink line-clamp-2 mb-2">
                {pick(project.title, project.title_en)}
              </p>
              {stretchChallenging ? (
                <>
                  <ProgressBar
                    percentage={toStretchPos(finalGoal)}
                    extension={{
                      from: toStretchPos(finalGoal),
                      to: toStretchPos(project.current_amount),
                    }}
                    markers={[
                      { position: toStretchPos(finalGoal), reached: true, final: true },
                      { position: 100, reached: false, final: true },
                    ]}
                  />
                  <p className="text-xs text-ink-muted mt-1">
                    <span className="inline-block text-[10px] font-bold text-white bg-ink rounded px-1.5 py-px mr-1.5 align-middle">
                      {t.detail.stretchRibbonBadge}
                    </span>
                    <span className="font-bold text-caramel-700 tabular-nums">
                      {stats.progressUncapped}% · {t.detail.stretchRibbonTitle}
                    </span>
                    <span className="whitespace-nowrap"> · 残り{stats.daysLeft}日</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {t.detail.stretchNextPrefix}
                    {formatCurrency(nextStretch.amount - project.current_amount)}
                    {t.detail.stretchNextSuffix}「{nextStretch.title}」
                    {t.detail.stretchNextAchieve}
                  </p>
                </>
              ) : (
                <>
                  <ProgressBar percentage={stats.progress} />
                  <p className="text-xs text-ink-muted mt-1 tabular-nums">
                    {stats.progress}% 達成 · 残り{stats.daysLeft}日
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* ステッパー */}
        {step < 4 && (
          <ol className="grid grid-cols-4 gap-2 mb-8">
            {steps.map((s) => (
              <li
                key={s.id}
                aria-current={s.id === step ? "step" : undefined}
                className="min-w-0"
              >
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    s.id <= step ? "bg-ink" : "bg-line"
                  )}
                />
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-bold",
                    s.id === step
                      ? "text-ink"
                      : s.id < step
                      ? "text-ink-soft"
                      : "text-ink-faint"
                  )}
                >
                  {s.id < step ? (
                    <Check size={12} className="flex-shrink-0" />
                  ) : (
                    <span className="tabular-nums flex-shrink-0">{s.id}</span>
                  )}
                  <span className="truncate">{t.backing[s.key]}</span>
                </p>
              </li>
            ))}
          </ol>
        )}

        <div key={step} className="page-enter">
            {/* STEP 1: リターン選択 */}
            {step === 1 && (
              <div className="space-y-4">
                <Card>
                  <h2
                    className="text-xl font-bold text-ink mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.backing.chooseSupport}
                  </h2>
                  <p className="text-sm text-ink-muted mb-4">
                    {t.backing.chooseSupportNote}
                  </p>

                  {/* リターン一覧（数量選択） */}
                  <div className="space-y-3">
                    {rewards.map((reward) => {
                      const qty = quantities[reward.id] || 0;
                      const stock = remainingStock(reward);
                      const soldOut = stock != null && stock <= 0;
                      const atMax = stock != null && qty >= stock;
                      return (
                        <div
                          key={reward.id}
                          className={cn(
                            "p-4 rounded-xl border transition-colors",
                            qty > 0
                              ? "border-ink bg-cream-50"
                              : "border-line bg-white",
                            soldOut && "opacity-50"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-lg font-bold text-ink tabular-nums">
                                {formatCurrency(reward.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-cream-100 text-ink-soft">
                                {reward.reward_type === "digital" ? "デジタル" : reward.reward_type === "physical" ? "物品" : "体験"}
                              </span>
                              {!reward.needs_address && (
                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-cream-100 text-ink-soft">
                                  {t.backing.addressNotRequired}
                                </span>
                              )}
                              {stock != null && (
                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 tabular-nums">
                                  {soldOut ? "完売" : `残り${stock}`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-ink">
                              {pick(reward.title, reward.title_en)}
                            </p>
                            {pick(reward.description, reward.description_en) && (
                              <p className="text-xs text-ink-soft leading-relaxed mt-1.5 whitespace-pre-line">
                                {pick(reward.description, reward.description_en)}
                              </p>
                            )}
                            {reward.estimated_delivery_date && (
                              <p className="text-xs text-ink-muted mt-2">
                                {t.backing.estimatedDelivery}:{" "}
                                {new Date(
                                  reward.estimated_delivery_date
                                ).toLocaleDateString(
                                  locale === "en" ? "en-US" : "ja-JP",
                                  { year: "numeric", month: "long" }
                                )}
                              </p>
                            )}
                          </div>

                          {/* 数量ステッパー */}
                          <div className="flex items-center justify-end gap-3 mt-3">
                            <span className="text-xs text-ink-muted">{t.backing.quantity}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQty(reward, qty - 1)}
                                disabled={qty <= 0}
                                className="w-8 h-8 rounded-lg border border-line-strong bg-white text-ink font-bold flex items-center justify-center disabled:opacity-30 hover:bg-cream-100 transition-colors"
                                aria-label="減らす"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-ink tabular-nums">{qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(reward, qty + 1)}
                                disabled={soldOut || atMax}
                                className="w-8 h-8 rounded-full font-bold flex items-center justify-center disabled:opacity-30 btn-caramel"
                                aria-label="増やす"
                              >
                                ＋
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 自由金額（掲載者が許可した場合のみ・上乗せ可） */}
                  {allowFreeAmount && (
                    <div className="mt-4 p-4 rounded-xl border border-line">
                      <div className="flex items-center gap-3 mb-3">
                        <Heart size={18} className="text-ink-muted flex-shrink-0" />
                        <div>
                          <p className="font-bold text-ink">{t.backing.freeAmountTitle}</p>
                          <p className="text-xs text-ink-muted">
                            {t.backing.freeAmountNote}
                          </p>
                        </div>
                      </div>
                      {/* number 入力は既定の幅を持ち、flex の min-width:auto では
                          縮まないので min-w-0 が無いとカードの外へはみ出す */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-muted">¥</span>
                        <input
                          type="number"
                          value={freeAmount || ""}
                          onChange={(e) => setFreeAmount(parseInt(e.target.value) || 0)}
                          placeholder={String(MIN_AMOUNT)}
                          className="flex-1 min-w-0 h-11 px-3.5 rounded-lg border border-line-strong bg-white text-ink font-bold text-lg tabular-nums outline-none hover:border-ink-faint focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors"
                          min={MIN_AMOUNT}
                        />
                      </div>
                      {/* 下限を割っていると「次へ」が押せないので、理由をその場に出す */}
                      {rewardsTotal === 0 &&
                        effectiveFree > 0 &&
                        effectiveFree < MIN_AMOUNT && (
                          <p className="text-xs font-semibold text-red-600 mt-2">
                            {t.backing.freeAmountMin}
                          </p>
                        )}
                    </div>
                  )}
                </Card>

                {/* 金額サマリー */}
                {amount > 0 && (
                  <Card variant="outlined">
                    <div className="space-y-2">
                      {selectedItems.map((it) => (
                        <div key={it.reward.id} className="flex justify-between text-sm">
                          <span className="text-ink-soft truncate max-w-[70%]">
                            {pick(it.reward.title, it.reward.title_en)}{" "}
                            <span className="text-ink-muted">× {it.qty}</span>
                          </span>
                          <span className="font-semibold text-ink tabular-nums">
                            {formatCurrency(it.reward.amount * it.qty)}
                          </span>
                        </div>
                      ))}
                      {effectiveFree > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ink-soft">{t.backing.freeSupport}</span>
                          <span className="font-semibold text-ink tabular-nums">{formatCurrency(effectiveFree)}</span>
                        </div>
                      )}
                      <div className="border-t border-line pt-2 flex justify-between text-sm">
                        <span className="text-ink-soft">{t.backing.subtotal}</span>
                        <span className="font-semibold text-ink tabular-nums">{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-soft">{t.backing.fee}</span>
                        <span className="font-semibold text-ink tabular-nums">{formatCurrency(fee)}</span>
                      </div>
                      <div className="border-t border-line pt-2 flex justify-between items-baseline">
                        <span className="font-bold text-ink">{t.backing.total}</span>
                        <span className="text-xl font-bold text-ink tabular-nums">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 2: ゲスト情報入力 */}
            {step === 2 && (
              <Card>
                <h2
                  className="text-xl font-bold text-ink mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.backing.yourInfo}
                </h2>
                <p className="text-sm text-ink-muted mb-6">
                  {t.backing.yourInfoNote}
                </p>

                <div className="space-y-4">
                  <Input
                    label={t.backing.nickname}
                    placeholder="例：たろう、匿名希望"
                    value={guestInfo.nickname}
                    onChange={(e) => setGuestInfo(p => ({ ...p, nickname: e.target.value }))}
                    icon={<User size={16} />}
                    fullWidth
                    hint={t.backing.nicknameHint}
                  />

                  <Input
                    label={t.backing.email}
                    type="email"
                    placeholder="caramel@example.com"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(p => ({ ...p, email: e.target.value }))}
                    icon={<Mail size={16} />}
                    fullWidth
                    hint={t.backing.emailHint}
                  />

                  <Textarea
                    label={t.backing.messageLabel}
                    placeholder={t.backing.messagePlaceholder}
                    value={guestInfo.message}
                    onChange={(e) => setGuestInfo(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    fullWidth
                  />

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-ink-soft font-medium">
                      {t.backing.anonymous}
                    </span>
                  </label>

                  {/* ついでの会員登録。支援自体はゲストのままでもできる */}
                  {!user && (
                    <div className="pt-4 border-t border-line">
                      {registeredEmail ? (
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                          <Check
                            size={16}
                            className="text-emerald-700 flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-bold text-emerald-800">
                              {t.backing.accountConfirmSent}
                            </p>
                            {registeredEmail !== guestInfo.email && (
                              <p className="text-xs text-amber-800 font-semibold mt-1">
                                {t.backing.accountEmailChanged.replace(
                                  "{email}",
                                  registeredEmail
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wantsAccount}
                              onChange={(e) =>
                                setWantsAccount(e.target.checked)
                              }
                              className="rounded mt-0.5"
                            />
                            <span>
                              <span className="block text-sm text-ink font-bold">
                                {t.backing.createAccount}
                              </span>
                              <span className="block text-xs text-ink-muted mt-0.5 leading-relaxed">
                                {t.backing.createAccountNote}
                              </span>
                            </span>
                          </label>

                          {wantsAccount && (
                            <div className="mt-3 relative">
                              <Input
                                label={t.auth.password}
                                type={showPassword ? "text" : "password"}
                                placeholder={t.auth.passwordPlaceholder}
                                value={accountPassword}
                                onChange={(e) =>
                                  setAccountPassword(e.target.value)
                                }
                                icon={<Lock size={16} />}
                                fullWidth
                                hint={t.backing.passwordHint}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={t.auth.password}
                                className="absolute right-4 top-[38px] text-ink-muted hover:text-ink"
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 住所入力（物品リターンを含む場合） */}
                  {needsAddress && (
                    <div className="space-y-3 pt-4 border-t border-line">
                      <p className="text-sm font-bold text-ink flex items-center gap-2">
                        <MapPin size={16} className="text-ink-muted" />
                        {t.backing.shippingTitle}
                      </p>

                      {/* 配送先の国（選ぶと住所欄がその国の形式に切り替わります） */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-bold text-ink">
                          {t.backing.country}
                        </label>
                        <select
                          value={guestInfo.address.country}
                          onChange={(e) =>
                            setGuestInfo((p) => ({
                              ...p,
                              address: {
                                // 国を変えたら住所欄はリセット（形式が変わるため）
                                country: e.target.value,
                                recipient_name: p.address.recipient_name,
                                postal_code: "",
                                prefecture: "",
                                city: "",
                                address_line1: "",
                                address_line2: "",
                              },
                            }))
                          }
                          className="w-full h-11 px-3.5 rounded-lg border border-line-strong bg-white text-ink outline-none hover:border-ink-faint focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {countryLabel(c, locale)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label={t.backing.recipientName}
                        placeholder={
                          guestInfo.address.country === "JP"
                            ? "山田 太郎"
                            : "Taro Yamada"
                        }
                        value={guestInfo.address.recipient_name}
                        onChange={(e) =>
                          setGuestInfo((p) => ({
                            ...p,
                            address: { ...p.address, recipient_name: e.target.value },
                          }))
                        }
                        fullWidth
                      />

                      {/* 国ごとの住所フォーマットで入力欄を出し分け */}
                      {countryFormat.fields.map((f) => (
                        <Input
                          key={f.key}
                          label={f.label}
                          placeholder={f.placeholder}
                          value={guestInfo.address[f.key] || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setGuestInfo((p) => ({
                              ...p,
                              address: { ...p.address, [f.key]: v },
                            }));
                            // 日本の郵便番号は7桁そろった時点で自動補完
                            if (f.lookup && v.replace(/[^0-9]/g, "").length === 7) {
                              lookupPostalCode(v);
                            }
                          }}
                          onBlur={
                            f.lookup
                              ? (e) => lookupPostalCode(e.target.value)
                              : undefined
                          }
                          inputMode={f.lookup ? "numeric" : undefined}
                          fullWidth
                          hint={
                            f.lookup
                              ? isLookingUpZip
                                ? t.backing.lookingUp
                                : t.backing.zipHint
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* STEP 3: 支払い */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <h2
                    className="text-xl font-bold text-ink mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.backing.paymentTitle}
                  </h2>

                  {/* 支払い方法は Stripe の安全な決済ページで選ぶ */}
                  <div className="p-4 rounded-xl border border-line bg-cream-50">
                    <p className="text-sm font-bold text-ink mb-1">
                      {t.backing.paymentNote}
                    </p>
                    <p className="text-xs text-ink-muted mb-3">
                      {t.backing.paymentNote2}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {paymentMethodBadges(locale).map((m) => (
                        <span
                          key={m}
                          className="px-2 py-1 rounded-md text-xs font-semibold bg-white border border-line text-ink-soft"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
                    <Lock size={12} />
                    <span>{t.backing.secureNote}</span>
                  </div>
                </Card>

                {/* 最終確認 */}
                <Card variant="outlined">
                  <p className="font-bold text-ink mb-3">{t.backing.confirmTitle}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">{t.backing.project}</span>
                      <span className="font-semibold text-ink text-right max-w-[60%] line-clamp-1">
                        {pick(project.title, project.title_en)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-ink-muted flex-shrink-0">{t.backing.reward}</span>
                      <span className="font-semibold text-ink text-right">
                        {selectedItems.length === 0 ? (
                          effectiveFree > 0 ? "応援のみ（リターンなし）" : "-"
                        ) : (
                          <>
                            {selectedItems.map((it) => (
                              <span key={it.reward.id} className="block">
                                {pick(it.reward.title, it.reward.title_en)} ×{" "}
                                {it.qty}
                              </span>
                            ))}
                            {effectiveFree > 0 && (
                              <span className="block text-ink-muted tabular-nums">＋自由応援 {formatCurrency(effectiveFree)}</span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink-muted flex-shrink-0">{t.backing.emailShort}</span>
                      <span className="font-semibold text-ink truncate">{guestInfo.email}</span>
                    </div>
                    <div className="border-t border-line pt-2 flex justify-between items-baseline">
                      <span className="font-bold text-ink">{t.backing.total}</span>
                      <span className="text-xl font-bold text-ink tabular-nums">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </Card>

                <Button
                  fullWidth
                  size="xl"
                  loading={isProcessing}
                  onClick={handlePayment}
                  icon={<Lock size={18} />}
                >
                  {formatCurrency(total)}{t.backing.payButton}
                </Button>
              </div>
            )}
        </div>

        {/* ナビゲーション */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              icon={<ChevronLeft size={18} />}
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
            >
              {t.common.back}
            </Button>
            {step < 3 && (
              <Button
                icon={<ChevronRight size={18} />}
                iconPosition="right"
                onClick={handleNext}
                disabled={!canProceed()}
                loading={signingUp}
              >
                {t.common.next}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
