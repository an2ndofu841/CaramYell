import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import { formatDeadline, formatSlotTime } from "@/lib/schedule/time";
import {
  ACCENT,
  INK,
  INK_MUTED,
  INK_SOFT,
  LINE,
  SURFACE,
  escapeHtml,
  getResend,
  isRetryable,
  linkify,
  singleLine,
  sleep,
} from "./digital-reward";

/**
 * 体験リターンの日程調整のメール。
 * - 案内: 対象の支援者へ「日程を選ぶ」リンクを送る（1人ずつ別のリンク）
 * - 確定: 支援者が枠を選んだ・変えたときに本人へ送る控え
 */

export type ScheduleInvitationEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  rewardTitle: string;
  scheduleTitle: string;
  description: string;
  deadline: string | null;
  /** 本人用の日程選択ページ */
  url: string;
};

export type ScheduleConfirmationEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  scheduleTitle: string;
  /** 予約済みの枠すべて（開始が早い順）。空なら全部取り消した */
  slots: { startsAt: string; note: string }[];
  /** 予約できる枠数（支援の口数） */
  tickets: number;
  durationMinutes: number | null;
  location: string;
  url: string;
};

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 3;

function layout(heading: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};border-radius:12px;">
          <tr>
            <td style="padding:24px 28px 20px;border-bottom:1px solid ${LINE};">
              <div style="color:${INK};font-size:15px;font-weight:bold;letter-spacing:-0.01em;">${escapeHtml(SITE_NAME)}</div>
              <div style="color:${INK};font-size:20px;font-weight:bold;padding-top:14px;">${escapeHtml(heading)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;">
              ${inner}
              <p style="margin:24px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;">
                このメールは、プロジェクトの掲載者が ${escapeHtml(SITE_NAME)} から支援者の皆さまへお送りしています。<br />
                リンクはあなた専用です。ほかの方と共有しないでください。<br />
                このメールは送信専用です。
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:${INK_MUTED};font-size:12px;">${escapeHtml(SITE_NAME)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:24px 0 0;"><a href="${url}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:8px;">${escapeHtml(label)}</a></p>`;

const box = (html: string) =>
  `<div style="background:${SURFACE};border:1px solid ${LINE};border-radius:8px;padding:18px;color:${INK};font-size:14px;line-height:1.9;margin-top:16px;">${html}</div>`;

const multiline = (text: string) => linkify(escapeHtml(text)).replace(/\r?\n/g, "<br />");

export const invitationSubject = (projectTitle: string, scheduleTitle: string) =>
  singleLine(`【${projectTitle}】${scheduleTitle}の日程をお選びください`);

function invitationHtml(e: ScheduleInvitationEmail): string {
  const inner = `
    <p style="margin:0;color:${INK_SOFT};font-size:15px;line-height:1.8;">
      ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
      「${escapeHtml(e.projectTitle)}」へのご支援ありがとうございました。<br />
      リターン「${escapeHtml(e.rewardTitle)}」の日程調整のご案内です。下のボタンから、ご都合のよい日時をお選びください。
    </p>
    ${box(
      `<div style="font-weight:bold;">${escapeHtml(e.scheduleTitle)}</div>${
        e.description ? `<div style="margin-top:8px;">${multiline(e.description)}</div>` : ""
      }${
        e.deadline
          ? `<div style="margin-top:8px;color:${ACCENT};font-weight:bold;">回答期限: ${escapeHtml(formatDeadline(e.deadline))}</div>`
          : ""
      }`
    )}
    ${button(e.url, "日程を選ぶ")}
    <p style="margin:12px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;word-break:break-all;">ボタンが開けない場合: ${escapeHtml(e.url)}</p>`;
  return layout("日程調整のお願い", inner);
}

function invitationText(e: ScheduleInvitationEmail): string {
  return [
    e.nickname ? `${e.nickname} さん` : null,
    `「${e.projectTitle}」へのご支援ありがとうございました。`,
    `リターン「${e.rewardTitle}」の日程調整のご案内です。下のリンクから、ご都合のよい日時をお選びください。`,
    "",
    `■ ${e.scheduleTitle}`,
    e.description || null,
    e.deadline ? `回答期限: ${formatDeadline(e.deadline)}` : null,
    "",
    `日程を選ぶ: ${e.url}`,
    "",
    "リンクはあなた専用です。ほかの方と共有しないでください。",
    SITE_NAME,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function invitationPayload(from: string, e: ScheduleInvitationEmail) {
  return {
    from,
    to: [e.to],
    subject: invitationSubject(e.projectTitle, e.scheduleTitle),
    html: invitationHtml(e),
    text: invitationText(e),
  };
}

/**
 * 日程調整の案内を一括送信する。100通ずつ、塊ごとに冪等キーを付ける。
 * 送れなかった塊の宛先は failed に入れて返す。
 */
export async function sendScheduleInvitations(
  emails: ScheduleInvitationEmail[],
  requestId: string
): Promise<{ sent: string[]; failed: string[] }> {
  const client = getResend();
  if (!client) return { sent: [], failed: emails.map((e) => e.to) };

  const result = { sent: [] as string[], failed: [] as string[] };
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const payload = chunk.map((e) => invitationPayload(client.from, e));
    const idempotencyKey = `batch-reward-schedule/${requestId}/chunk-${i / BATCH_SIZE}`;

    let ok = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { error } = await client.resend.batch.send(payload, { idempotencyKey });
      if (!error) {
        ok = true;
        break;
      }
      console.error(
        `Failed to send schedule invitation batch (attempt ${attempt + 1}):`,
        error.name,
        error.message
      );
      if (!isRetryable(error.name)) break;
      await sleep(2 ** attempt * 1000);
    }
    (ok ? result.sent : result.failed).push(...chunk.map((e) => e.to));
  }
  return result;
}

/** 掲載者が見た目を確かめるための1通（リンクはプレビュー用で予約はできない） */
export async function sendScheduleInvitationTest(e: ScheduleInvitationEmail): Promise<boolean> {
  const client = getResend();
  if (!client) return false;
  const payload = invitationPayload(client.from, e);
  const { error } = await client.resend.emails.send({
    ...payload,
    subject: `【テスト送信】${payload.subject}`,
  });
  if (error) {
    console.error("Failed to send schedule invitation test:", error.message);
    return false;
  }
  return true;
}

/** 支援者が日程を選んだ・変えた・取り消したときの控え。失敗しても予約は有効なので握りつぶす */
export async function sendScheduleConfirmation(e: ScheduleConfirmationEmail): Promise<void> {
  const client = getResend();
  if (!client) return;

  const lines = e.slots.map(
    (s) => `${formatSlotTime(s.startsAt, e.durationMinutes)}${s.note ? `（${s.note}）` : ""}`
  );
  const booked = lines.length > 0;
  const rest = Math.max(0, e.tickets - lines.length);

  const subject = singleLine(
    booked
      ? `【${e.projectTitle}】${e.scheduleTitle}の日程を受け付けました`
      : `【${e.projectTitle}】${e.scheduleTitle}の予約を取り消しました`
  );
  const lead = booked
    ? `「${e.projectTitle}」の${e.scheduleTitle}について、以下の日程で受け付けました。`
    : `「${e.projectTitle}」の${e.scheduleTitle}の予約を取り消しました。あらためて日程をお選びください。`;
  const restNote = booked && rest > 0 ? `あと${rest}枠、日程を選べます。` : null;

  const details = booked
    ? box(
        `<div style="font-weight:bold;">${escapeHtml(e.scheduleTitle)}</div>
         <div style="margin-top:8px;">${lines
           .map((l) => `<div>・<strong>${escapeHtml(l)}</strong></div>`)
           .join("")}</div>${
           e.location
             ? `<div style="margin-top:8px;">場所・参加方法:<br />${multiline(e.location)}</div>`
             : ""
         }`
      )
    : "";

  const inner = `
    <p style="margin:0;color:${INK_SOFT};font-size:15px;line-height:1.8;">
      ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
      ${escapeHtml(lead)}
      ${restNote ? `<br /><strong style="color:${ACCENT};">${escapeHtml(restNote)}</strong>` : ""}
    </p>
    ${details}
    ${button(e.url, booked ? "予約内容を確認・変更する" : "日程を選ぶ")}`;

  const text = [
    e.nickname ? `${e.nickname} さん` : null,
    lead,
    restNote,
    ...lines.map((l) => `・${l}`),
    booked && e.location ? `場所・参加方法:\n${e.location}` : null,
    "",
    `確認・変更: ${e.url}`,
    "",
    SITE_NAME,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const { error } = await client.resend.emails.send({
    from: client.from,
    to: [e.to],
    subject,
    html: layout(booked ? "日程を受け付けました" : "予約を取り消しました", inner),
    text,
  });
  if (error) console.error("Failed to send schedule confirmation:", error.message);
}

export const schedulePageUrl = (token: string) => `${SITE_URL}/schedule/${token}`;
