"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import {
  collectDigitalRecipients,
  isDigitalReward,
  type RewardDelivery,
} from "@/lib/project/digital-delivery";
import { cn } from "@/lib/utils";
import type { Backer, Reward } from "@/types";

type SendMode = "test" | "unsent" | "all";

const DEFAULT_MESSAGE = `下記のURLからお受け取りください。

URL：
（ダウンロード期限：　月　日まで）

改めまして、ご支援ありがとうございました！`;

const defaultSubject = (projectTitle: string, reward: Reward) =>
  `【${projectTitle}】${reward.title}のお届け`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * デジタルリターン（データ・URL で届けるもの）を、受け取る支援者へメールで一括送付するパネル。
 * 上位プランに含まれる分も送り先に入れ、送付済みかどうかをリターンごとに記録する。
 */
export default function DigitalDeliveryPanel({
  projectId,
  projectTitle,
  backers,
  rewards,
}: {
  projectId: string;
  projectTitle: string;
  backers: Backer[];
  rewards: Reward[];
}) {
  const digitalRewards = useMemo(
    () => rewards.filter(isDigitalReward).sort((a, b) => a.amount - b.amount),
    [rewards]
  );

  const [rewardId, setRewardId] = useState(digitalRewards[0]?.id ?? "");
  const reward = digitalRewards.find((r) => r.id === rewardId);
  const [subject, setSubject] = useState(
    reward ? defaultSubject(projectTitle, reward) : ""
  );
  const [message, setMessage] = useState(reward?.digital_delivery_info || DEFAULT_MESSAGE);
  const [deliveries, setDeliveries] = useState<RewardDelivery[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [testEmail, setTestEmail] = useState<string | null>(null);
  const [sending, setSending] = useState<SendMode | null>(null);
  const [showList, setShowList] = useState(false);

  const loadDeliveries = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/projects/${projectId}/digital-deliveries`);
      if (!res.ok) return;
      const data = await res.json();
      setDeliveries(data.deliveries || []);
      setEmailConfigured(data.emailConfigured !== false);
      setTestEmail(data.testEmail ?? null);
    } catch {
      // 送付記録が読めなくても送信操作はできる（サーバー側で未送付を判定する）
    }
  }, [projectId]);

  useEffect(() => {
    if (digitalRewards.length > 0) loadDeliveries();
  }, [digitalRewards.length, loadDeliveries]);

  const { recipients, missingEmailCount } = useMemo(
    () =>
      rewardId
        ? collectDigitalRecipients(backers, rewards, rewardId, deliveries)
        : { recipients: [], missingEmailCount: 0 },
    [backers, rewards, rewardId, deliveries]
  );
  const unsent = recipients.filter((r) => !r.sentAt);

  if (digitalRewards.length === 0) return null;

  const selectReward = (next: Reward) => {
    setRewardId(next.id);
    setSubject(defaultSubject(projectTitle, next));
    setMessage(next.digital_delivery_info || DEFAULT_MESSAGE);
  };

  const send = async (mode: SendMode) => {
    if (!reward) return;
    const count = mode === "all" ? recipients.length : unsent.length;
    if (mode !== "test") {
      const ok = window.confirm(
        mode === "all"
          ? `送付済みの人も含めて${count}人にメールを送信します。送信後は取り消せません。よろしいですか？`
          : `未送付の${count}人にメールを送信します。送信後は取り消せません。よろしいですか？`
      );
      if (!ok) return;
    }

    setSending(mode);
    try {
      const res = await fetch(`/api/dashboard/projects/${projectId}/digital-deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: reward.id,
          subject,
          message,
          mode,
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "送信に失敗しました");

      if (mode === "test") {
        toast.success(`${data.testSentTo} にテストメールを送りました`);
        return;
      }
      setDeliveries(data.deliveries || []);
      if (data.failed > 0) {
        toast.error(
          `${data.sent}人に送信し、${data.failed}人には送れませんでした。時間をおいて「未送付に送信」で再度お試しください`
        );
      } else {
        toast.success(`${data.sent}人にメールを送信しました`);
      }
      if (data.recordFailed) {
        toast.error("送信はできましたが、送付記録の保存に失敗しました。運営にお問い合わせください");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(null);
    }
  };

  const hasUrl = /https?:\/\//.test(message);
  const canSend = emailConfigured && subject.trim() !== "" && message.trim() !== "" && !sending;

  return (
    <Card className="rounded-xl">
      <div className="mb-4">
        <h3 className="font-bold text-ink">
          デジタルリターンのメール送付
        </h3>
        <p className="text-xs text-ink-muted mt-0.5">
          受け取る支援者のメールアドレスへ一括で送ります。上位プランの支援者も含み、同じアドレスへは1通にまとめます。送った相手は記録されるので、あとから支援した人だけに追加で送れます
        </p>
      </div>

      {digitalRewards.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {digitalRewards.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectReward(r)}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-bold border transition-colors",
                r.id === rewardId
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong bg-white text-ink-soft hover:bg-cream-50"
              )}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}

      {reward && (
        <>
          <dl className="grid grid-cols-3 rounded-lg border border-line divide-x divide-line mb-3">
            {[
              { label: "送付対象（1人1通）", value: recipients.length },
              { label: "送付済み", value: recipients.length - unsent.length },
              { label: "未送付", value: unsent.length },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2.5 min-w-0">
                <dt className="text-[11px] sm:text-xs font-bold text-ink-muted truncate">{s.label}</dt>
                <dd className="text-xl font-bold text-ink tabular-nums">
                  {s.value}
                  <span className="text-xs font-semibold text-ink-muted ml-1">人</span>
                </dd>
              </div>
            ))}
          </dl>

          {missingEmailCount > 0 && (
            <p className="text-xs text-amber-700 mb-3">
              メールアドレスが無い支援（現地支援など）が{missingEmailCount}件あります。この方々には別の方法でお届けください
            </p>
          )}

          {recipients.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowList((v) => !v)}
                className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-ink"
              >
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", showList && "rotate-180")}
                />
                送付先を{showList ? "閉じる" : "見る"}
              </button>
              {showList && (
                <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-line rounded-lg border border-line">
                  {recipients.map((r) => (
                    <li key={r.email} className="flex items-center gap-3 px-4 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink truncate">
                          {r.name || "（お名前未入力）"}
                        </p>
                        <p className="text-xs text-ink-muted truncate">{r.email}</p>
                        {r.backerIds.length > 1 && (
                          <p className="text-xs text-ink-muted">
                            {r.backerIds.length}件の支援を1通にまとめて送付
                          </p>
                        )}
                      </div>
                      {r.sentAt ? (
                        <Badge color="mint" size="sm">
                          送付済 {formatDate(r.sentAt)}
                        </Badge>
                      ) : (
                        <Badge color="gray" size="sm">
                          未送付
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-3 mb-4">
            <Input
              label="件名"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              fullWidth
            />
            <Textarea
              label="本文"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={5000}
              hint={
                hasUrl
                  ? "宛名・お礼の挨拶・プロジェクトへのリンクは自動で入ります。URL はリンクになります"
                  : undefined
              }
              error={
                hasUrl
                  ? undefined
                  : "本文にURLが入っていません。ダウンロード先などのURLを貼り付けてください"
              }
              fullWidth
            />
          </div>

          {!emailConfigured && (
            <p className="text-xs text-red-600 mb-3">
              メール送信の設定が完了していないため、現在は送信できません
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              icon={<Mail size={16} />}
              loading={sending === "test"}
              disabled={!canSend}
              onClick={() => send("test")}
              title={testEmail ? `${testEmail} に送ります` : undefined}
            >
              自分にテスト送信
            </Button>
            {unsent.length === 0 && recipients.length > 0 ? (
              <Button
                variant="outline"
                icon={<Send size={16} />}
                loading={sending === "all"}
                disabled={!canSend}
                onClick={() => send("all")}
              >
                全員に再送信（{recipients.length}人）
              </Button>
            ) : (
              <Button
                icon={<Send size={16} />}
                loading={sending === "unsent"}
                disabled={!canSend || unsent.length === 0}
                onClick={() => send("unsent")}
              >
                未送付の{unsent.length}人に送信
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
