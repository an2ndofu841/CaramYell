"use client";

import { useMemo, useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Search,
  Loader2,
  ClipboardList,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCountryFormat } from "@/lib/data/countries";
import {
  expandBackerRewards,
  mergePackLines,
  type PackLine,
} from "@/lib/project/reward-bundle";
import type { Backer, Reward, ShippingStatus } from "@/types";

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

/** 住所を1行の文字列に整形（国ごとの並びに合わせる）。郵便番号は別に表示するので含めない */
function formatAddress(b: Backer): string {
  const a = b.guest_address;
  if (!a) return "";
  const fmt = getCountryFormat(a.country);
  const parts = fmt.fields
    .filter((f) => f.key !== "postal_code")
    .map((f) => (a as unknown as Record<string, string>)[f.key])
    .filter(Boolean);
  const country = a.country && a.country !== "JP" ? ` (${a.country})` : "";
  return `${parts.join(" ")}${country}`;
}

function recipientName(b: Backer): string {
  return b.guest_address?.recipient_name || b.guest_nickname || "（氏名未登録）";
}

const UNSHIPPED: ShippingStatus[] = ["pending", "preparing"];

/** 同じ荷物にまとめる1件。同じ氏名・住所で、発送状況と追跡番号も同じ支援を束ねる */
interface Shipment {
  key: string;
  backers: Backer[];
  head: Backer;
  status: ShippingStatus;
  trackingNumber: string;
  pack: PackLine[];
  amount: number;
}

const normalize = (s: string | undefined) =>
  (s || "").normalize("NFKC").replace(/[\s\-‐−ー]/g, "").toLowerCase();

function shipmentKey(b: Backer): string {
  return [
    normalize(recipientName(b)),
    normalize(b.guest_address?.postal_code),
    normalize(formatAddress(b)),
    b.shipping_status || "pending",
    b.tracking_number || "",
  ].join("|");
}

interface PrepRow {
  key: string;
  title: string;
  amount: number;
  total: number;
  recipients: { shipmentKey: string; name: string; quantity: number }[];
}

export default function FulfillmentTab({
  projectId,
  backers,
  rewards,
  onUpdated,
}: {
  projectId: string;
  backers: Backer[];
  rewards: Reward[];
  onUpdated: (updated: Backer) => void;
}) {
  const [filter, setFilter] = useState<"all" | ShippingStatus>("all");
  const [itemFilter, setItemFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  // 発送が必要なのは「支払済み」かつ「住所あり（物品リターンを含む）」の支援。
  // 同じ人が何回支援していても、同じ住所なら1つの荷物として個数を合算する
  const shipments = useMemo(() => {
    const groups = new Map<string, Backer[]>();
    for (const b of backers) {
      if (b.status !== "paid" || !b.guest_address) continue;
      const key = shipmentKey(b);
      groups.set(key, [...(groups.get(key) || []), b]);
    }
    return [...groups.entries()]
      .map(([key, list]): Shipment => {
        const sorted = [...list].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );
        const head = sorted[0];
        return {
          key,
          backers: sorted,
          head,
          status: (head.shipping_status || "pending") as ShippingStatus,
          trackingNumber: head.tracking_number || "",
          pack: mergePackLines(sorted.map((b) => expandBackerRewards(b, rewards))),
          amount: sorted.reduce((sum, b) => sum + b.amount, 0),
        };
      })
      .sort((a, b) => b.head.created_at.localeCompare(a.head.created_at));
  }, [backers, rewards]);

  // 未発送分で「何を何個・誰に」用意するかの集計
  const unshipped = useMemo(
    () => shipments.filter((s) => UNSHIPPED.includes(s.status)),
    [shipments]
  );
  const prepRows = useMemo(() => {
    const rows = new Map<string, PrepRow>();
    for (const s of unshipped) {
      for (const line of s.pack) {
        if (!line.needsAddress) continue;
        const row =
          rows.get(line.key) ??
          { key: line.key, title: line.title, amount: line.amount, total: 0, recipients: [] };
        row.total += line.quantity;
        row.recipients.push({
          shipmentKey: s.key,
          name: recipientName(s.head),
          quantity: line.quantity,
        });
        rows.set(line.key, row);
      }
    }
    return [...rows.values()].sort((a, b) => b.amount - a.amount);
  }, [unshipped]);

  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = shipments.filter((sh) => sh.status === s).length;
      return acc;
    },
    {} as Record<ShippingStatus, number>
  );

  const filtered = shipments.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (itemFilter && !s.pack.some((l) => l.key === itemFilter)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.backers.some(
        (b) =>
          (b.guest_address?.recipient_name || "").toLowerCase().includes(q) ||
          (b.guest_nickname || "").toLowerCase().includes(q) ||
          (b.guest_email || "").toLowerCase().includes(q)
      ) ||
      formatAddress(s.head).toLowerCase().includes(q) ||
      s.pack.some((l) => l.title.toLowerCase().includes(q))
    );
  });
  const itemFilterTitle = itemFilter
    ? shipments.flatMap((s) => s.pack).find((l) => l.key === itemFilter)?.title
    : undefined;

  // 荷物単位の操作なので、束ねたすべての支援に同じ更新をかける
  const patch = async (shipment: Shipment, body: Record<string, unknown>) => {
    setBusyKey(shipment.key);
    try {
      const results = await Promise.allSettled(
        shipment.backers.map(async (b) => {
          const res = await fetch(
            `/api/dashboard/projects/${projectId}/backers/${b.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "更新に失敗しました");
          onUpdated(data.backer);
        })
      );
      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      if (failed.length > 0) {
        throw new Error(
          failed.length < results.length
            ? `${results.length}件中${failed.length}件の更新に失敗しました`
            : failed[0].reason instanceof Error
            ? failed[0].reason.message
            : "更新に失敗しました"
        );
      }
      toast.success("更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setBusyKey(null);
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

  // 配送業者向けにCSVを書き出す（1行 = 1つの荷物）
  const exportCsv = () => {
    const header = [
      "氏名",
      "郵便番号",
      "住所",
      "国",
      "メール",
      "支援回数",
      "支援プラン",
      "発送するもの",
      "発送不要の特典",
      "金額",
      "発送状況",
      "追跡番号",
      "支援日",
    ];
    const join = (lines: PackLine[]) =>
      lines.map((l) => `${l.title}×${l.quantity}`).join(" / ");
    const rows = filtered.map((s) => {
      const b = s.head;
      return [
        b.guest_address?.recipient_name || b.guest_nickname || "",
        b.guest_address?.postal_code || "",
        formatAddress(b),
        b.guest_address?.country || "",
        [...new Set(s.backers.map((x) => x.guest_email).filter(Boolean))].join(" / "),
        String(s.backers.length),
        s.pack
          .filter((l) => l.planQuantity > 0)
          .map((l) => `${l.title}×${l.planQuantity}`)
          .join(" / "),
        join(s.pack.filter((l) => l.needsAddress)),
        join(s.pack.filter((l) => !l.needsAddress)),
        String(s.amount),
        STATUS_META[s.status].label,
        s.trackingNumber,
        s.backers
          .map((x) => new Date(x.created_at).toLocaleDateString("ja-JP"))
          .join(" / "),
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
      {/* サマリー（荷物の数） */}
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
            <p className="text-2xl font-bold text-gray-800">
              {counts[s]}
              <span className="text-xs font-semibold text-gray-400 ml-1">件</span>
            </p>
          </button>
        ))}
      </div>

      {/* 用意するもの（未発送分の合計と送り先） */}
      {shipments.length > 0 && (
        <Card>
          <div className="mb-3">
            <h3 className="flex items-center gap-1.5 font-bold text-gray-800">
              <ClipboardList size={16} className="text-caramel-500" />
              用意するもの
              <span className="text-xs font-semibold text-gray-400">
                未発送 {unshipped.length}件分
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              上位プランには、それより安いリターンもすべて含めて数えています。同じ人が複数回支援している場合は、その回数分を合算しています。品目を押すとその送り先だけに絞り込めます
            </p>
          </div>
          {prepRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              未発送の品目はありません
            </p>
          ) : (
            <ul className="divide-y divide-caramel-100">
              {prepRows.map((row) => (
                <li key={row.key} className="py-3 first:pt-0 last:pb-0">
                  <button
                    onClick={() =>
                      setItemFilter(itemFilter === row.key ? null : row.key)
                    }
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors",
                      itemFilter === row.key
                        ? "bg-candy-pink/10"
                        : "hover:bg-caramel-50"
                    )}
                  >
                    <span className="font-bold text-gray-800 min-w-0 truncate">
                      {row.title}
                    </span>
                    <span className="ml-auto flex items-baseline gap-0.5 text-caramel-600 font-bold tabular-nums flex-shrink-0">
                      <span className="text-2xl">{row.total}</span>
                      <span className="text-xs">個</span>
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 px-3 max-h-28 overflow-y-auto">
                    {row.recipients.map((r) => (
                      <span
                        key={r.shipmentKey}
                        className="px-2 py-0.5 rounded-lg bg-caramel-50 text-xs text-gray-600"
                      >
                        {r.name}
                        {r.quantity > 1 && (
                          <span className="font-bold text-caramel-600 ml-1">
                            ×{r.quantity}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

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
          {(filter !== "all" || itemFilter) && (
            <button
              onClick={() => {
                setFilter("all");
                setItemFilter(null);
              }}
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

      {itemFilterTitle && (
        <p className="text-sm text-gray-500 -mt-2">
          「<span className="font-bold text-gray-700">{itemFilterTitle}</span>」を送る送り先 {filtered.length}件を表示中
        </p>
      )}

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              {shipments.length === 0
                ? "発送が必要な支援はまだありません"
                : "該当する支援はありません"}
            </p>
            {shipments.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                住所が必要なリターンの支援がここに表示されます
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const b = s.head;
            const meta = STATUS_META[s.status];
            const plans = s.pack.filter((l) => l.planQuantity > 0);
            const shipLines = s.pack.filter((l) => l.needsAddress);
            const otherLines = s.pack.filter((l) => !l.needsAddress);
            const emails = [
              ...new Set(s.backers.map((x) => x.guest_email).filter(Boolean)),
            ];
            const busy = busyKey === s.key;
            const shippedAt = s.backers.find((x) => x.shipped_at)?.shipped_at;
            return (
              <Card key={s.key}>
                {/* 宛先 */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400">送り先</p>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-lg font-bold text-gray-800">
                        {recipientName(b)}
                        <span className="text-sm font-semibold text-gray-500 ml-1">様</span>
                      </span>
                      <Badge color={meta.color} size="sm">
                        {meta.label}
                      </Badge>
                      {s.backers.length > 1 && (
                        <Badge color="pink" size="sm">
                          {s.backers.length}回支援・まとめて発送
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {b.guest_address?.postal_code && (
                        <span className="mr-1">〒{b.guest_address.postal_code}</span>
                      )}
                      {formatAddress(b)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {emails.length > 0 ? emails.join(" / ") : "メール未登録（現地支援）"}
                    </p>
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
                  {s.pack.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      （リターンなしの応援）
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        支援プラン：
                        <span className="font-bold text-gray-700">
                          {plans
                            .map((l) =>
                              l.planQuantity > 1
                                ? `${l.title} ×${l.planQuantity}`
                                : l.title
                            )
                            .join(" / ")}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-gray-500 mb-1.5">
                        送るもの
                      </p>
                      {shipLines.length > 0 ? (
                        <ul className="space-y-1.5">
                          {shipLines.map((l) => (
                            <li
                              key={l.key}
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <span className="font-semibold">{l.title}</span>
                              <span className="px-2 py-0.5 rounded-lg bg-white font-bold text-caramel-600 tabular-nums">
                                × {l.quantity}
                              </span>
                              {l.planQuantity === 0 && (
                                <span className="text-[11px] text-gray-400">
                                  上位プランに含む
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          発送する品目はありません
                        </p>
                      )}
                      {plans
                        .filter((l) => l.description)
                        .map((l) => (
                          <p
                            key={l.key}
                            className="mt-2 text-xs text-gray-500 whitespace-pre-line"
                          >
                            <span className="font-bold">
                              プラン内容{l.planQuantity > 1 ? `（×${l.planQuantity}）` : ""}：
                            </span>
                            {l.description}
                          </p>
                        ))}
                      {otherLines.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          <span className="font-bold">発送不要の特典（別途対応）：</span>
                          {otherLines
                            .map((l) => `${l.title} ×${l.quantity}`)
                            .join(" / ")}
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    支援額 {formatCurrency(s.amount)}
                    {s.backers.length > 1 && `（${s.backers.length}回の合計）`} ·{" "}
                    {s.backers
                      .map((x) => new Date(x.created_at).toLocaleDateString("ja-JP"))
                      .join(" / ")}
                  </p>
                </div>

                {/* 追跡番号 */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    value={trackingDrafts[s.key] ?? s.trackingNumber}
                    onChange={(e) =>
                      setTrackingDrafts((p) => ({ ...p, [s.key]: e.target.value }))
                    }
                    placeholder="追跡番号（任意）"
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-caramel-100 text-sm outline-none focus:border-candy-pink transition-colors"
                  />
                  <button
                    onClick={() =>
                      patch(s, {
                        trackingNumber: trackingDrafts[s.key] ?? s.trackingNumber,
                      })
                    }
                    disabled={busy}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border-2 border-caramel-100 hover:bg-caramel-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    番号を保存
                  </button>
                </div>

                {/* ステータス変更 */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-caramel-100">
                  {STATUS_ORDER.map((st) => (
                    <button
                      key={st}
                      onClick={() => patch(s, { shippingStatus: st })}
                      disabled={busy || s.status === st}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-100",
                        s.status === st
                          ? "text-white"
                          : "text-gray-500 border-2 border-caramel-100 hover:bg-caramel-50"
                      )}
                      style={
                        s.status === st
                          ? {
                              background:
                                "linear-gradient(135deg, #F2807B, #F5A34B)",
                            }
                          : {}
                      }
                    >
                      {busy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        STATUS_META[st].icon
                      )}
                      {STATUS_META[st].label}
                    </button>
                  ))}
                  {shippedAt && (
                    <span className="text-xs text-gray-400 self-center ml-auto">
                      発送 {new Date(shippedAt).toLocaleDateString("ja-JP")}
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
