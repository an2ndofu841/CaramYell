"use client";

import { useState } from "react";
import { Banknote, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { cn, formatCurrency } from "@/lib/utils";
import type { Project, Reward } from "@/types";

interface OfflineBackingFormProps {
  project: Project;
  onSaved: () => void;
  onClose: () => void;
}

const EMPTY_ADDRESS = {
  recipient_name: "",
  postal_code: "",
  prefecture: "",
  city: "",
  address_line1: "",
  address_line2: "",
};

/**
 * 現地（会場）で現金を受け取った支援を記録するフォーム。
 *
 * その場で聞ける最低限（お名前・金額）だけで登録でき、メールアドレスは任意。
 * 入れておくと支援完了メールが届く。リターンを選ぶと金額は自動で積み上がり、
 * リターンなしの応援金額だけでも記録できる。
 */
export default function OfflineBackingForm({
  project,
  onSaved,
  onClose,
}: OfflineBackingFormProps) {
  const rewards = (project.rewards || []) as Reward[];

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [freeAmount, setFreeAmount] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [showAddress, setShowAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  const remainingOf = (r: Reward) =>
    r.quantity_total != null
      ? Math.max(r.quantity_total - (r.quantity_claimed || 0), 0)
      : null;

  const changeQty = (r: Reward, delta: number) => {
    setQty((prev) => {
      const next = Math.max(0, (prev[r.id] || 0) + delta);
      const remaining = remainingOf(r);
      const capped = remaining != null ? Math.min(next, remaining) : next;
      return { ...prev, [r.id]: capped };
    });
  };

  const selected = rewards
    .filter((r) => (qty[r.id] || 0) > 0)
    .map((r) => ({ reward: r, quantity: qty[r.id] }));
  const rewardsTotal = selected.reduce(
    (s, it) => s + it.reward.amount * it.quantity,
    0
  );
  const freeNum = freeAmount === "" ? 0 : Math.floor(Number(freeAmount));
  const freeIssue =
    freeAmount !== "" && (!Number.isFinite(freeNum) || freeNum < 0)
      ? "0円以上の整数で入力してください"
      : null;
  const total = rewardsTotal + (freeIssue ? 0 : freeNum);
  const needsAddress = selected.some((it) => it.reward.needs_address);
  const emailIssue =
    email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "メールアドレスの形式が正しくありません"
      : null;

  const canSubmit = total > 0 && !freeIssue && !emailIssue && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${project.id}/offline-backings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname,
            email,
            items: selected.map((it) => ({
              rewardId: it.reward.id,
              quantity: it.quantity,
            })),
            freeAmount: freeIssue ? 0 : freeNum,
            message,
            note,
            isAnonymous,
            address: showAddress || needsAddress ? address : null,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "記録に失敗しました");
        return;
      }
      toast.success(
        `${formatCurrency(total)} の現地支援を記録しました${
          email.trim() ? "（確認メールを送信）" : ""
        }`
      );
      onSaved();
      onClose();
    } catch {
      toast.error("記録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-caramel-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Banknote size={18} className="text-caramel-500" />
            現地支援を記録
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            会場などで現金を受け取った支援をここから登録します。手数料はかかりません。
            登録するとすぐ支援総額と支援者数に反映されます。
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:bg-caramel-50"
          aria-label="閉じる"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Input
          label="お名前（ニックネーム）"
          placeholder="例：たろう"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
          fullWidth
        />
        <Input
          label="メールアドレス（任意）"
          type="email"
          placeholder="入れると支援完了メールが届きます"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailIssue ?? undefined}
          fullWidth
        />
      </div>

      {rewards.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">リターン</p>
          <div className="space-y-2">
            {rewards.map((r) => {
              const remaining = remainingOf(r);
              const soldOut = remaining === 0;
              const q = qty[r.id] || 0;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2",
                    q > 0
                      ? "border-caramel-300 bg-caramel-50"
                      : "border-caramel-100 bg-white",
                    soldOut && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(r.amount)}
                      {remaining != null && ` · 残り${remaining}`}
                      {r.needs_address && " · 住所が必要"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQty(r, -1)}
                      disabled={q === 0}
                      className="w-8 h-8 rounded-full bg-caramel-100 text-caramel-600 flex items-center justify-center disabled:opacity-40"
                      aria-label="1つ減らす"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-gray-800">
                      {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQty(r, 1)}
                      disabled={soldOut || (remaining != null && q >= remaining)}
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-40"
                      style={{
                        background: "linear-gradient(135deg, #F2807B, #F5A34B)",
                      }}
                      aria-label="1つ増やす"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Input
          label={
            rewards.length > 0
              ? "追加の応援金額（リターンなし・任意）"
              : "応援金額"
          }
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          placeholder="0"
          value={freeAmount}
          onChange={(e) => setFreeAmount(e.target.value)}
          error={freeIssue ?? undefined}
          hint="円"
          fullWidth
        />
        <div className="flex flex-col justify-end">
          <div className="p-3 rounded-2xl bg-caramel-50 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-gray-600">
              受け取った金額
            </span>
            <span className="text-2xl font-bold text-caramel-600">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      <Textarea
        label="応援メッセージ（任意）"
        placeholder="支援者からのメッセージがあれば"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        rows={2}
        fullWidth
      />

      <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="rounded border-gray-300"
        />
        匿名で表示する
      </label>

      {(needsAddress || showAddress) ? (
        <div className="mt-4 p-4 rounded-2xl border-2 border-caramel-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              お届け先{needsAddress ? "（発送が必要なリターンがあります）" : "（任意）"}
            </p>
            {!needsAddress && (
              <button
                type="button"
                onClick={() => setShowAddress(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                閉じる
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">
            その場で手渡しした場合は空欄のままで構いません。
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="宛名"
              value={address.recipient_name}
              onChange={(e) =>
                setAddress({ ...address, recipient_name: e.target.value })
              }
              fullWidth
            />
            <Input
              label="郵便番号"
              value={address.postal_code}
              onChange={(e) =>
                setAddress({ ...address, postal_code: e.target.value })
              }
              fullWidth
            />
            <Input
              label="都道府県"
              value={address.prefecture}
              onChange={(e) =>
                setAddress({ ...address, prefecture: e.target.value })
              }
              fullWidth
            />
            <Input
              label="市区町村"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              fullWidth
            />
            <Input
              label="番地"
              value={address.address_line1}
              onChange={(e) =>
                setAddress({ ...address, address_line1: e.target.value })
              }
              fullWidth
            />
            <Input
              label="建物名・部屋番号"
              value={address.address_line2}
              onChange={(e) =>
                setAddress({ ...address, address_line2: e.target.value })
              }
              fullWidth
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddress(true)}
          className="mt-3 text-xs font-semibold text-caramel-600 hover:underline"
        >
          + お届け先を入力する
        </button>
      )}

      <Textarea
        label="メモ（掲載者用・支援者には見えません）"
        placeholder="例：9/27 生誕ライブ物販で受領"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        fullWidth
        className="mt-4"
      />

      <div className="flex gap-2 mt-5">
        <Button
          onClick={submit}
          disabled={!canSubmit}
          loading={saving}
          icon={<Banknote size={16} />}
        >
          {formatCurrency(total)} を現金支援として記録
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          キャンセル
        </Button>
      </div>
    </Card>
  );
}
