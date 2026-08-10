"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Smartphone,
  Star,
  User,
  Check,
  CreditCard,
  Smartphone as ApplePay,
  Globe,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { calcFee, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getMockProjectBySlug, getAllMockProjects } from "@/lib/data/mockProjects";
import type { Reward, Project } from "@/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryLabel,
  getCountryFormat,
  missingAddressFields,
} from "@/lib/data/countries";

const steps = [
  { id: 1, key: "stepReward" as const, icon: "🎁" },
  { id: 2, key: "stepInfo" as const, icon: "👤" },
  { id: 3, key: "stepPayment" as const, icon: "💳" },
  { id: 4, key: "stepDone" as const, icon: "🎉" },
];

const paymentMethods = [
  { id: "apple_pay", label: "Apple Pay", icon: "🍎", desc: "タッチひとつで支払い完了" },
  { id: "google_pay", label: "Google Pay", icon: "🔵", desc: "Googleアカウントで簡単決済" },
  { id: "card", label: "クレジットカード", icon: "💳", desc: "Visa / Mastercard / AMEX" },
  { id: "paypal", label: "PayPal", icon: "🅿️", desc: "海外からもOK" },
];

export default function BackingClient({
  projectSlug,
  selectedRewardId,
  allowFreeAmount = true,
  realProject = null,
}: {
  projectSlug: string;
  selectedRewardId?: string;
  allowFreeAmount?: boolean;
  realProject?: Project | null;
}) {
  // 実プロジェクトがあれば実データ＋実決済、なければモック＋デモ決済
  const { t, locale } = useLocale();
  const isReal = !!realProject;
  const project =
    realProject || getMockProjectBySlug(projectSlug) || getAllMockProjects()[0];
  const rewards = project.rewards || [];

  const [step, setStep] = useState(1);
  // リターンごとの選択個数（カート方式）
  const [quantities, setQuantities] = useState<Record<string, number>>(
    selectedRewardId ? { [selectedRewardId]: 1 } : {}
  );
  const [freeAmount, setFreeAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("apple_pay");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);

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

  const stats = {
    progress: Math.min(Math.round((project.current_amount / project.goal_amount) * 100), 100),
    daysLeft: project.end_date
      ? Math.max(0, Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000))
      : 0,
  };

  const canProceed = () => {
    if (step === 1) return amount >= 100;
    if (step === 2) {
      if (!guestInfo.email) return false;
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

    // デモ（モックプロジェクト）は疑似決済のまま
    if (!isReal) {
      await new Promise((r) => setTimeout(r, 2000));
      setIsProcessing(false);
      setStep(4);
      return;
    }

    // 実プロジェクトは Stripe Checkout へ遷移
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
    <div className="min-h-screen pt-20 pb-tabbar" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* 戻るリンク */}
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-caramel-600 transition-colors font-medium py-4"
        >
          <ChevronLeft size={16} />
          {t.backing.backToProject}
        </Link>

        {/* プロジェクト概要 */}
        <Card className="mb-6">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-16 rounded-2xl overflow-hidden bg-caramel-100 flex-shrink-0">
              <img
                src={project.main_image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{project.title}</p>
              <ProgressBar percentage={stats.progress} />
              <p className="text-xs text-gray-400 mt-1">
                {stats.progress}% 達成 · 残り{stats.daysLeft}日
              </p>
            </div>
          </div>
        </Card>

        {/* ステッパー */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-caramel-100 -z-10" />
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  s.id < step ? "text-white" : s.id === step ? "text-white shadow-candy" : "bg-white text-gray-400 border-2 border-caramel-100"
                )}
                  style={s.id <= step ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" } : {}}
                >
                  {s.id < step ? <Check size={16} /> : s.icon}
                </div>
                <span className={cn("text-xs font-semibold hidden sm:block", s.id === step ? "text-caramel-600" : "text-gray-400")}>
                  {t.backing[s.key]}
                </span>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: リターン選択 */}
            {step === 1 && (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">🎁 {t.backing.chooseSupport}</h2>
                  <p className="text-sm text-gray-500 mb-4">
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
                            "p-4 rounded-2xl border-2 transition-all",
                            qty > 0
                              ? "border-candy-pink bg-candy-pink/5"
                              : "border-caramel-100 bg-white",
                            soldOut && "opacity-50"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-lg font-bold text-caramel-600">
                                {formatCurrency(reward.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-caramel-100 text-caramel-700">
                                {reward.reward_type === "digital" ? "📱 デジタル" : reward.reward_type === "physical" ? "📦 物品" : "⭐ 体験"}
                              </span>
                              {!reward.needs_address && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                                  {t.backing.addressNotRequired}
                                </span>
                              )}
                              {stock != null && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                  {soldOut ? "完売" : `残り${stock}`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-800">{reward.title}</p>
                          </div>

                          {/* 数量ステッパー */}
                          <div className="flex items-center justify-end gap-3 mt-3">
                            <span className="text-xs text-gray-400">{t.backing.quantity}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQty(reward, qty - 1)}
                                disabled={qty <= 0}
                                className="w-8 h-8 rounded-full border-2 border-caramel-200 text-caramel-600 font-bold flex items-center justify-center disabled:opacity-30 hover:bg-caramel-50 transition-colors"
                                aria-label="減らす"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-gray-800">{qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(reward, qty + 1)}
                                disabled={soldOut || atMax}
                                className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
                                style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
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
                    <div className="mt-4 p-4 rounded-2xl border-2 border-caramel-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart size={20} className="text-candy-pink flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-800">{t.backing.freeAmountTitle}</p>
                          <p className="text-xs text-gray-400">
                            {t.backing.freeAmountNote}
                          </p>
                        </div>
                      </div>
                      {/* number 入力は既定の幅を持ち、flex の min-width:auto では
                          縮まないので min-w-0 が無いとカードの外へはみ出す */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">¥</span>
                        <input
                          type="number"
                          value={freeAmount || ""}
                          onChange={(e) => setFreeAmount(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="flex-1 min-w-0 py-2 px-3 rounded-xl border-2 border-caramel-200 font-bold text-lg outline-none focus:border-candy-pink"
                          min={0}
                        />
                      </div>
                    </div>
                  )}
                </Card>

                {/* 金額サマリー */}
                {amount > 0 && (
                  <Card variant="outlined">
                    <div className="space-y-2">
                      {selectedItems.map((it) => (
                        <div key={it.reward.id} className="flex justify-between text-sm">
                          <span className="text-gray-500 truncate max-w-[70%]">
                            {it.reward.title} <span className="text-gray-400">× {it.qty}</span>
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(it.reward.amount * it.qty)}
                          </span>
                        </div>
                      ))}
                      {effectiveFree > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t.backing.freeSupport}</span>
                          <span className="font-semibold">{formatCurrency(effectiveFree)}</span>
                        </div>
                      )}
                      <div className="border-t border-caramel-100 pt-2 flex justify-between text-sm">
                        <span className="text-gray-500">{t.backing.subtotal}</span>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t.backing.fee}</span>
                        <span className="font-semibold">{formatCurrency(fee)}</span>
                      </div>
                      <div className="border-t border-caramel-100 pt-2 flex justify-between">
                        <span className="font-bold">{t.backing.total}</span>
                        <span className="text-xl font-bold text-caramel-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 2: ゲスト情報入力 */}
            {step === 2 && (
              <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-2">👤 {t.backing.yourInfo}</h2>
                <p className="text-sm text-gray-500 mb-6">
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
                    <span className="text-sm text-gray-600 font-medium">
                      {t.backing.anonymous}
                    </span>
                  </label>

                  {/* 住所入力（物品リターンを含む場合） */}
                  {needsAddress && (
                    <div className="space-y-3 pt-2 border-t border-caramel-100">
                      <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <MapPin size={16} className="text-caramel-500" />
                        {t.backing.shippingTitle}
                      </p>

                      {/* 配送先の国（選ぶと住所欄がその国の形式に切り替わります） */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-semibold text-gray-700">
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
                          className="w-full px-4 py-3 rounded-2xl border-2 border-caramel-100 bg-white text-gray-800 outline-none focus:border-candy-pink transition-colors"
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">💳 {t.backing.paymentTitle}</h2>

                  {isReal ? (
                    // 実決済では Stripe の安全な決済ページで支払い方法を選ぶ
                    <div className="p-4 rounded-2xl border-2 border-caramel-100 bg-caramel-50/50">
                      <p className="text-sm font-bold text-gray-700 mb-1">
                        {t.backing.paymentNote}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {t.backing.paymentNote2}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["💳 カード", "🍎 Apple Pay", "🔗 Link"].map((m) => (
                          <span
                            key={m}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white border-2 border-caramel-100 text-gray-600"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          paymentMethod === method.id ? "border-candy-pink" : "border-caramel-100 hover:border-caramel-200 bg-white"
                        )}
                        style={paymentMethod === method.id ? { background: "rgba(242, 128, 123, 0.03)" } : {}}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          paymentMethod === method.id ? "border-candy-pink bg-candy-pink" : "border-gray-300"
                        )}>
                          {paymentMethod === method.id && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-bold text-gray-800">{method.label}</p>
                          <p className="text-xs text-gray-400">{method.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <Lock size={12} />
                    <span>{t.backing.secureNote}</span>
                  </div>
                </Card>

                {/* 最終確認 */}
                <Card variant="outlined">
                  <p className="font-bold text-gray-700 mb-3">{t.backing.confirmTitle}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t.backing.project}</span>
                      <span className="font-semibold text-right max-w-[60%] line-clamp-1">
                        {project.title}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">{t.backing.reward}</span>
                      <span className="font-semibold text-right">
                        {selectedItems.length === 0 ? (
                          effectiveFree > 0 ? "応援のみ（リターンなし）" : "-"
                        ) : (
                          <>
                            {selectedItems.map((it) => (
                              <span key={it.reward.id} className="block">
                                {it.reward.title} × {it.qty}
                              </span>
                            ))}
                            {effectiveFree > 0 && (
                              <span className="block text-gray-500">＋自由応援 {formatCurrency(effectiveFree)}</span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t.backing.emailShort}</span>
                      <span className="font-semibold">{guestInfo.email}</span>
                    </div>
                    <div className="border-t border-caramel-100 pt-2 flex justify-between">
                      <span className="font-bold">{t.backing.total}</span>
                      <span className="text-xl font-bold text-caramel-600">{formatCurrency(total)}</span>
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

            {/* STEP 4: 完了 */}
            {step === 4 && (
              <Card>
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="text-8xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-gray-800 mb-3"
                  >
                    {t.backing.thanks}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-500 mb-2"
                  >
                    決済確認メールを <strong>{guestInfo.email}</strong> に送りました。
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-gray-400 text-sm mb-8"
                  >
                    プロジェクトが成功したら、リターンをお届けします 🎁
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <Link href={`/projects/${projectSlug}`}>
                      <Button variant="secondary">
                        プロジェクトに戻る
                      </Button>
                    </Link>
                    <Link href="/projects">
                      <Button>
                        他のプロジェクトを見る
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 pt-6 border-t border-caramel-100"
                  >
                    <p className="text-sm text-gray-400 mb-3">SNSでシェアして、もっと広めよう！</p>
                    <div className="flex gap-2 justify-center">
                      {["Twitter", "LINE", "Facebook"].map((sns) => (
                        <button
                          key={sns}
                          className="px-4 py-2 rounded-full text-xs font-bold bg-caramel-50 text-caramel-600 hover:bg-caramel-100 transition-colors"
                        >
                          {sns}でシェア
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

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
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
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
