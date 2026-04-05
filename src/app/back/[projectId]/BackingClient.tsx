"use client";

import { useState } from "react";
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

// ダミーのプロジェクト・リターンデータ
const dummyProject = {
  id: "1",
  title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
  slug: "scent-music-album",
  main_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
  goal_amount: 1500000,
  current_amount: 1823000,
  backer_count: 342,
  end_date: "2025-08-31",
  rewards: [
    {
      id: "r1",
      title: "感謝のメッセージ＋名前をライナーノーツに掲載",
      description: "デジタルメッセージ＋名前掲載",
      amount: 1000,
      reward_type: "digital",
      needs_address: false,
    },
    {
      id: "r2",
      title: "限定お礼ボイス＋デジタルアルバム先行配信",
      description: "音声メッセージ＋先行配信",
      amount: 3000,
      reward_type: "digital",
      needs_address: false,
    },
    {
      id: "r3",
      title: "アロマデバイス＋CD＋限定香水セット",
      description: "フルパッケージ",
      amount: 15000,
      reward_type: "physical",
      needs_address: true,
    },
    {
      id: "r4",
      title: "【VIP】レコーディング見学＋サイン入りフルセット",
      description: "VIP体験パッケージ",
      amount: 50000,
      reward_type: "experience",
      needs_address: true,
    },
  ],
};

const steps = [
  { id: 1, title: "リターン選択", icon: "🎁" },
  { id: 2, title: "あなたの情報", icon: "👤" },
  { id: 3, title: "お支払い", icon: "💳" },
  { id: 4, title: "完了", icon: "🎉" },
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
}: {
  projectSlug: string;
  selectedRewardId?: string;
}) {
  const [step, setStep] = useState(1);
  const [selectedReward, setSelectedReward] = useState(
    dummyProject.rewards.find((r) => r.id === selectedRewardId) || null
  );
  const [customAmount, setCustomAmount] = useState(1000);
  const [useCustomAmount, setUseCustomAmount] = useState(!selectedRewardId);
  const [paymentMethod, setPaymentMethod] = useState("apple_pay");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    nickname: "",
    email: "",
    message: "",
    address: {
      postal_code: "",
      prefecture: "",
      city: "",
      address_line1: "",
    },
  });

  const needsAddress = selectedReward?.needs_address ?? true;
  const amount = useCustomAmount ? customAmount : (selectedReward?.amount || 1000);
  const { fee, total } = calcFee(amount);

  const stats = {
    progress: Math.min(Math.round((dummyProject.current_amount / dummyProject.goal_amount) * 100), 100),
    daysLeft: Math.max(0, Math.ceil((new Date(dummyProject.end_date).getTime() - Date.now()) / 86400000)),
  };

  const canProceed = () => {
    if (step === 1) return amount >= 100;
    if (step === 2) {
      if (!guestInfo.email) return false;
      if (needsAddress && !useCustomAmount && selectedReward?.needs_address) {
        return !!(guestInfo.address.postal_code && guestInfo.address.prefecture && guestInfo.address.city && guestInfo.address.address_line1);
      }
      return true;
    }
    return true;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen pt-20 pb-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* 戻るリンク */}
        <Link
          href={`/projects/${dummyProject.slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-caramel-600 transition-colors font-medium py-4"
        >
          <ChevronLeft size={16} />
          プロジェクトへ戻る
        </Link>

        {/* プロジェクト概要 */}
        <Card className="mb-6">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-16 rounded-2xl overflow-hidden bg-caramel-100 flex-shrink-0">
              <img
                src={dummyProject.main_image_url}
                alt={dummyProject.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{dummyProject.title}</p>
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
                  style={s.id <= step ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" } : {}}
                >
                  {s.id < step ? <Check size={16} /> : s.icon}
                </div>
                <span className={cn("text-xs font-semibold hidden sm:block", s.id === step ? "text-caramel-600" : "text-gray-400")}>
                  {s.title}
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🎁 応援の方法を選ぶ</h2>

                  {/* カスタム金額 */}
                  <div className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all mb-4",
                    useCustomAmount ? "border-candy-pink" : "border-caramel-100 hover:border-caramel-200"
                  )}
                    onClick={() => { setUseCustomAmount(true); setSelectedReward(null); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        useCustomAmount ? "border-candy-pink bg-candy-pink" : "border-gray-300"
                      )}>
                        {useCustomAmount && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">金額を自由に指定する</p>
                        <p className="text-xs text-gray-400">リターンなしで純粋に応援したい方に</p>
                      </div>
                      <Heart size={20} className="text-candy-pink" />
                    </div>
                    {useCustomAmount && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-bold text-gray-500">¥</span>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                          className="flex-1 py-2 px-3 rounded-xl border-2 border-caramel-200 font-bold text-lg outline-none focus:border-candy-pink"
                          min={100}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>

                  {/* リターン一覧 */}
                  <div className="space-y-3">
                    {dummyProject.rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className={cn(
                          "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                          selectedReward?.id === reward.id && !useCustomAmount ? "border-candy-pink" : "border-caramel-100 hover:border-caramel-200 bg-white"
                        )}
                        onClick={() => { setSelectedReward(reward); setUseCustomAmount(false); }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                            selectedReward?.id === reward.id && !useCustomAmount ? "border-candy-pink bg-candy-pink" : "border-gray-300"
                          )}>
                            {selectedReward?.id === reward.id && !useCustomAmount && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-caramel-600">
                                {formatCurrency(reward.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-caramel-100 text-caramel-700">
                                {reward.reward_type === "digital" ? "📱 デジタル" : reward.reward_type === "physical" ? "📦 物品" : "⭐ 体験"}
                              </span>
                              {!reward.needs_address && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                                  住所不要
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-800">{reward.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 金額サマリー */}
                {amount > 0 && (
                  <Card variant="outlined">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">応援金額</span>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">手数料（10%）</span>
                        <span className="font-semibold">{formatCurrency(fee)}</span>
                      </div>
                      <div className="border-t border-caramel-100 pt-2 flex justify-between">
                        <span className="font-bold">お支払い合計</span>
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
                <h2 className="text-xl font-bold text-gray-800 mb-2">👤 あなたの情報</h2>
                <p className="text-sm text-gray-500 mb-6">
                  アカウント登録は不要です。メールアドレスだけでOK ✨
                </p>

                <div className="space-y-4">
                  <Input
                    label="ニックネーム（任意）"
                    placeholder="例：たろう、匿名希望"
                    value={guestInfo.nickname}
                    onChange={(e) => setGuestInfo(p => ({ ...p, nickname: e.target.value }))}
                    icon={<User size={16} />}
                    fullWidth
                    hint="リターンに名前を使用する場合に記入してください"
                  />

                  <Input
                    label="メールアドレス ※必須"
                    type="email"
                    placeholder="caramel@example.com"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(p => ({ ...p, email: e.target.value }))}
                    icon={<Mail size={16} />}
                    fullWidth
                    hint="決済確認・リターンの受け取りに使用します"
                  />

                  <Textarea
                    label="応援メッセージ（任意）"
                    placeholder="クリエイターへの応援メッセージを書いてください"
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
                      匿名で応援する（支援者一覧に名前を表示しない）
                    </span>
                  </label>

                  {/* 住所入力（物品リターンの場合） */}
                  {!useCustomAmount && selectedReward?.needs_address && (
                    <div className="space-y-3 pt-2 border-t border-caramel-100">
                      <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <MapPin size={16} className="text-caramel-500" />
                        配送先住所（物品リターンのため必須）
                      </p>

                      <Input
                        label="郵便番号"
                        placeholder="123-4567"
                        value={guestInfo.address.postal_code}
                        onChange={(e) => setGuestInfo(p => ({ ...p, address: { ...p.address, postal_code: e.target.value } }))}
                        fullWidth
                      />
                      <Input
                        label="都道府県"
                        placeholder="東京都"
                        value={guestInfo.address.prefecture}
                        onChange={(e) => setGuestInfo(p => ({ ...p, address: { ...p.address, prefecture: e.target.value } }))}
                        fullWidth
                      />
                      <Input
                        label="市区町村"
                        placeholder="渋谷区"
                        value={guestInfo.address.city}
                        onChange={(e) => setGuestInfo(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                        fullWidth
                      />
                      <Input
                        label="番地・建物名"
                        placeholder="1-2-3 カラメルビル101"
                        value={guestInfo.address.address_line1}
                        onChange={(e) => setGuestInfo(p => ({ ...p, address: { ...p.address, address_line1: e.target.value } }))}
                        fullWidth
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* STEP 3: 支払い */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">💳 お支払い方法</h2>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          paymentMethod === method.id ? "border-candy-pink" : "border-caramel-100 hover:border-caramel-200 bg-white"
                        )}
                        style={paymentMethod === method.id ? { background: "rgba(255, 107, 157, 0.03)" } : {}}
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

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <Lock size={12} />
                    <span>Stripeによる安全な決済。カード情報はCaramYellには保存されません。</span>
                  </div>
                </Card>

                {/* 最終確認 */}
                <Card variant="outlined">
                  <p className="font-bold text-gray-700 mb-3">お支払い内容の確認</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">プロジェクト</span>
                      <span className="font-semibold text-right max-w-[60%] line-clamp-1">
                        {dummyProject.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">リターン</span>
                      <span className="font-semibold">
                        {useCustomAmount ? "応援のみ（リターンなし）" : selectedReward?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">メールアドレス</span>
                      <span className="font-semibold">{guestInfo.email}</span>
                    </div>
                    <div className="border-t border-caramel-100 pt-2 flex justify-between">
                      <span className="font-bold">合計</span>
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
                  {formatCurrency(total)} を安全に支払う
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
                    応援ありがとうございます！
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
              戻る
            </Button>
            {step < 3 && (
              <Button
                icon={<ChevronRight size={18} />}
                iconPosition="right"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                次へ
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
