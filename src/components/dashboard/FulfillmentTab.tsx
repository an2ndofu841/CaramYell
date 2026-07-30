"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Search,
  Loader2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCountryFormat } from "@/lib/data/countries";
import type { Backer, ShippingStatus } from "@/types";

const STATUS_META: Record<
  ShippingStatus,
  { label: string; color: "gray" | "lemon" | "sky" | "mint"; icon: React.ReactNode }
> = {
  pending: { label: "未対応", color: "gray", icon: <Clock size={13} /> },
  preparing: { label: "準備中", color: "lemon", icon: <Package size={13} /> },
  shipped: { label: "発送済", color: "sky", icon: <Truck size={13} /> },
  delivered: { label: "お届け済", color: "mint", icon: <CheckCircle2 size={13} /> },
};

const STATUS_ORDER: ShippingStatus[] = [
  "pending",
  "preparing",
  "shipped",
  "delivered",
];

/** 住所を1行の文字列に整形（国ごとの並びに合わせる） */
function formatAddress(b: Backer): string {
  const a = b.guest_address;
  if (!a) return "";
  const fmt = getCountryFormat(a.country);
  const parts = fmt.fields
    .map((f) => (a as unknown as Record<string, string>)[f.key])
    .filter(Boolean);
  const country = a.country && a.country !== "JP" ? ` (${a.country})` : "";
  return `${parts.join(" ")}${country}`;
}

export default function FulfillmentTab({
  projectId,
  backers,
  onUpdated,
}: {
  projectId: string;
  backers: Backer[];
  onUpdated: (updated: Backer) => void;
}) {
  const [filter, setFilter] = useState<"all" | ShippingStatus>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  // 発送が必要なのは「支払済み」かつ「住所あり（物品リターンを含む）」の支援
  const shippable = backers.filter(
    (b) => b.status === "paid" && !!b.guest_address
  );

  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = shippable.filter(
        (b) => (b.shipping_status || "pending") === s
      ).length;
      return acc;
    },
    {} as Record<ShippingStatus, number>
  );

  const filtered = shippable.filter((b) => {
    const status = b.shipping_status || "pending";
    if (filter !== "all" && status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.guest_address?.recipient_name || "").toLowerCase().includes(q) ||
      (b.guest_nickname || "").toLowerCase().includes(q) ||
      b.guest_email.toLowerCase().includes(q) ||
      formatAddress(b).toLowerCase().includes(q)
    );
  });

  const patch = async (backer: Backer, body: Record<string, unknown>) => {
    setBusyId(backer.id);
    try {
      const res = await fetch(
        `/api/dashboard/projects/${projectId}/backers/${backer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      onUpdated(data.backer);
      toast.success("更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyId(null);
    }
  };

  const copyAddress = async (b: Backer) => {
    const text = [
      b.guest_address?.recipient_name,
      b.guest_address?.postal_code ? `〒${b.guest_address.postal_code}` : "",
      formatAddress(b),
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("宛先をコピーしました");
  };

  // 配送業者向けにCSVを書き出す
  const exportCsv = () => {
    const header = [
      "氏名",
      "郵便番号",
      "住所",
      "国",
      "メール",
      "リターン内訳",
      "金額",
      "発送状況",
      "追跡番号",
      "支援日",
    ];
    const rows = filtered.map((b) => {
      const items =
        (b.backer_items || []).length > 0
          ? (b.backer_items || [])
              .map((it) => `${it.reward_title}×${it.quantity}`)
              .join(" / ")
          : b.rewards?.title || "";
      return [
        b.guest_address?.recipient_name || b.guest_nickname || "",
        b.guest_address?.postal_code || "",
        formatAddress(b),
        b.guest_address?.country || "",
        b.guest_email,
        items,
        String(b.amount),
        STATUS_META[(b.shipping_status || "pending") as ShippingStatus].label,
        b.tracking_number || "",
        new Date(b.created_at).toLocaleDateString("ja-JP"),
      ];
    });
    const csv = [header, ...rows]
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    // Excel で文字化けしないよう BOM を付ける
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping-${projectId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSVを書き出しました");
  };

  return (
    <div className="space-y-5">
      {/* サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "all" : s)}
            className={cn(
              "p-3 rounded-2xl border-2 text-left transition-all",
              filter === s
                ? "border-candy-pink bg-candy-pink/5"
                : "border-caramel-100 bg-white hover:border-caramel-200"
            )}
          >
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              {STATUS_META[s].icon}
              <span className="text-xs font-bold">{STATUS_META[s].label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* 検索・書き出し */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="氏名・メール・住所で検索"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="px-4 py-2.5 rounded-2xl text-sm font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors whitespace-nowrap"
            >
              絞り込み解除
            </button>
          )}
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #C9A87C, #8FD4C4)" }}
          >
            <Download size={15} />
            CSV書き出し
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              {shippable.length === 0
                ? "発送が必要な支援はまだありません"
                : "該当する支援はありません"}
            </p>
            {shippable.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                住所が必要なリターンの支援がここに表示されます
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const status = (b.shipping_status || "pending") as ShippingStatus;
            const meta = STATUS_META[status];
            const items = b.backer_items || [];
            return (
              <Card key={b.id}>
                {/* 宛先 */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-800">
                        {b.guest_address?.recipient_name ||
                          b.guest_nickname ||
                          "（氏名未登録）"}
                      </span>
                      <Badge color={meta.color} size="sm">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {b.guest_address?.postal_code && (
                        <span className="mr-1">〒{b.guest_address.postal_code}</span>
                      )}
                      {formatAddress(b)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.guest_email}</p>
                  </div>
                  <button
                    onClick={() => copyAddress(b)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors flex-shrink-0"
                  >
                    <Copy size={13} />
                    宛先コピー
                  </button>
                </div>

                {/* 送るもの */}
                <div className="p-3 rounded-2xl bg-caramel-50 mb-3">
                  <p className="text-xs font-bold text-gray-500 mb-1.5">
                    送るもの
                  </p>
                  {items.length > 0 ? (
                    <ul className="space-y-1">
                      {items.map((it) => (
                        <li
                          key={it.id}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span className="font-semibold">{it.reward_title}</span>
                          <span className="font-bold text-caramel-600">
                            × {it.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {b.rewards?.title || "（明細なし）"}
                      <span className="text-xs text-gray-400 ml-2">
                        ※明細記録前の支援
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    支援額 {formatCurrency(b.amount)} ·{" "}
                    {new Date(b.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                {/* 追跡番号 */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    value={
                      trackingDrafts[b.id] ?? (b.tracking_number || "")
                    }
                    onChange={(e) =>
                      setTrackingDrafts((p) => ({ ...p, [b.id]: e.target.value }))
                    }
                    placeholder="追跡番号（任意）"
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors"
                  />
                  <button
                    onClick={() =>
                      patch(b, {
                        trackingNumber:
                          trackingDrafts[b.id] ?? b.tracking_number ?? "",
                      })
                    }
                    disabled={busyId === b.id}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    番号を保存
                  </button>
                </div>

                {/* ステータス変更 */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-caramel-100">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => patch(b, { shippingStatus: s })}
                      disabled={busyId === b.id || status === s}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-100",
                        status === s
                          ? "text-white"
                          : "text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50"
                      )}
                      style={
                        status === s
                          ? {
                              background:
                                "linear-gradient(135deg, #F2807B, #F5A34B)",
                            }
                          : {}
                      }
                    >
                      {busyId === b.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        STATUS_META[s].icon
                      )}
                      {STATUS_META[s].label}
                    </button>
                  ))}
                  {b.shipped_at && (
                    <span className="text-xs text-gray-400 self-center ml-auto">
                      発送 {new Date(b.shipped_at).toLocaleDateString("ja-JP")}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
