"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Flower2, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { buildNameCredits } from "@/lib/project/name-credits";
import { cn, formatCurrency } from "@/lib/utils";
import type { Backer } from "@/types";

const SEPARATORS = {
  newline: { label: "改行", value: "\n" },
  comma: { label: "「、」区切り", value: "、" },
} as const;

type Separator = keyof typeof SEPARATORS;

interface NameCreditPanelProps {
  backers: Backer[];
  onClose: () => void;
}

/**
 * フラスタ等に載せるお名前を、合計支援額の多い順にコピーするパネル。
 * 同じ人の複数回の支援は合算し、最低額で掲載対象を絞り込める。
 */
export default function NameCreditPanel({ backers, onClose }: NameCreditPanelProps) {
  const [minAmount, setMinAmount] = useState("");
  const [separator, setSeparator] = useState<Separator>("newline");
  const [withAmount, setWithAmount] = useState(false);
  const [copied, setCopied] = useState(false);

  const { credits, anonymousCount } = useMemo(() => buildNameCredits(backers), [backers]);

  const min = minAmount === "" ? 0 : Math.max(0, Math.floor(Number(minAmount)) || 0);
  const eligible = credits.filter((c) => c.total >= min);
  const named = eligible.filter((c) => c.name);
  const unnamedCount = eligible.length - named.length;

  const text = named
    .map((c) => (withAmount ? `${c.name}（${formatCurrency(c.total)}）` : c.name))
    .join(SEPARATORS[separator].value);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${named.length}名のお名前をコピーしました`);
    } catch {
      toast.error("コピーできませんでした。下の欄から手動でコピーしてください");
    }
  };

  return (
    <Card className="border-2 border-caramel-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Flower2 size={18} className="text-caramel-500" />
            フラスタ用お名前リスト
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            支払済みの支援をお名前ごとに合算し、合計額の多い順に並べています（同額は先に支援した順）。同じアカウントでもお名前が違う支援は別の名義として出します。
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

      <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end mb-4">
        <Input
          label="掲載する最低合計額（任意）"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="例：5000（空欄なら全員）"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          fullWidth
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-700">区切り</span>
          <div className="flex gap-2">
            {(Object.keys(SEPARATORS) as Separator[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeparator(key)}
                className={cn(
                  "px-3 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all",
                  separator === key
                    ? "border-candy-pink text-caramel-700 bg-caramel-50"
                    : "border-caramel-100 text-gray-500 hover:border-caramel-200"
                )}
              >
                {SEPARATORS[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={withAmount}
          onChange={(e) => setWithAmount(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-600 font-medium">
          お名前の後ろに合計額を付ける（確認用）
        </span>
      </label>

      {eligible.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {credits.length === 0
            ? "まだ名前を掲載できる支援がありません"
            : "条件に当てはまる支援者がいません"}
        </p>
      ) : (
        <ol className="max-h-80 overflow-y-auto divide-y divide-caramel-50 rounded-2xl border-2 border-caramel-100 mb-4">
          {eligible.map((c, i) => (
            <li key={c.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-7 text-right text-xs font-bold text-gray-400">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold truncate",
                    c.name ? "text-gray-800" : "text-gray-300"
                  )}
                >
                  {c.name || "名前未入力（コピー対象外）"}
                </p>
                {c.otherNames.length > 0 && (
                  <p className="text-xs text-amber-600 truncate">
                    別の表記: {c.otherNames.join(" / ")}
                  </p>
                )}
                {c.emailCount > 1 && (
                  <p className="text-xs text-amber-600 truncate">
                    {c.emailCount}つのメールアドレスからの支援を同じお名前で合算
                  </p>
                )}
                {c.relatedNames.length > 0 && (
                  <p className="text-xs text-amber-600 truncate">
                    同じメール・アカウントで「{c.relatedNames.join("」「")}」名義の支援もあり
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-caramel-600">{formatCurrency(c.total)}</p>
                {c.count > 1 && <p className="text-xs text-gray-400">{c.count}回の合計</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {(unnamedCount > 0 || anonymousCount > 0) && (
        <p className="text-xs text-gray-400 mb-3">
          {[
            unnamedCount > 0 && `名前未入力の${unnamedCount}名`,
            anonymousCount > 0 && `匿名を選んだ支援${anonymousCount}件`,
          ]
            .filter(Boolean)
            .join("・")}
          はコピーに含めていません。
        </p>
      )}

      {text && (
        <textarea
          readOnly
          value={text}
          rows={Math.min(6, separator === "newline" ? named.length : 3)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full py-3 px-4 rounded-2xl border-2 border-caramel-100 bg-caramel-50/40 text-sm text-gray-700 resize-none outline-none mb-4"
          aria-label="コピーされる内容"
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          閉じる
        </Button>
        <Button
          icon={copied ? <Check size={16} /> : <Copy size={16} />}
          onClick={handleCopy}
          disabled={!text}
        >
          {named.length}名をコピー
        </Button>
      </div>
    </Card>
  );
}
