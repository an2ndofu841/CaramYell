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
 * - 案内: 対象の支援者へ「希望を回答する」リンクを送る（1人ずつ別のリンク）
 * - 受付: 支援者が希望を回答・変更したときに本人へ送る控え
 * - 確定: 掲載者が日程を確定（変更・取り消し）したことを知らせる
 */

export type ScheduleInvitationEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  rewardTitle: string;
  scheduleTitle: string;
  description: string;
  deadline: string | null;
  /** 本人用の回答ページ */
  url: string;
};

export type ScheduleReceiptEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  scheduleTitle: string;
  /** 第1希望から順に */
  preferences: { startsAt: string; note: string }[];
  otherText: string;
  answers: { label: string; value: string }[];
  durationMinutes: number | null;
  url: string;
};

export type ScheduleConfirmationEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  scheduleTitle: string;
  /** 確定した枠すべて（開始が早い順）。空なら確定を取り消した */
  slots: { startsAt: string; note: string }[];
  durationMinutes: number | null;
  location: string;
  /** 取り消しのとき、希望を選び直してもらえるか（受付中で締切前） */
  canReanswer: boolean;
  deadline: string | null;
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
  singleLine(`【${projectTitle}】${scheduleTitle}のご希望の日程をお知らせください`);

function invitationHtml(e: ScheduleInvitationEmail): string {
  const inner = `
    <p style="margin:0;color:${INK_SOFT};font-size:15px;line-height:1.8;">
      ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
      「${escapeHtml(e.projectTitle)}」へのご支援ありがとうございました。<br />
      リターン「${escapeHtml(e.rewardTitle)}」の日程調整のご案内です。下のボタンから、ご希望の日程（第3希望まで）をお知らせください。ご希望をもとに掲載者が日程を決め、あらためてご連絡します。
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
    ${button(e.url, "希望の日程を回答する")}
    <p style="margin:12px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;word-break:break-all;">ボタンが開けない場合: ${escapeHtml(e.url)}</p>`;
  return layout("日程調整のお願い", inner);
}

function invitationText(e: ScheduleInvitationEmail): string {
  return [
    e.nickname ? `${e.nickname} さん` : null,
    `「${e.projectTitle}」へのご支援ありがとうございました。`,
    `リターン「${e.rewardTitle}」の日程調整のご案内です。下のリンクから、ご希望の日程（第3希望まで）をお知らせください。ご希望をもとに掲載者が日程を決め、あらためてご連絡します。`,
    "",
    `■ ${e.scheduleTitle}`,
    e.description || null,
    e.deadline ? `回答期限: ${formatDeadline(e.deadline)}` : null,
    "",
    `希望の日程を回答する: ${e.url}`,
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

type Payload = { from: string; to: string[]; subject: string; html: string; text: string };

/**
 * 100通ずつ一括送信し、塊ごとに冪等キーを付ける。
 * 送れなかった塊の宛先は failed に入れて返す。
 */
async function sendInBatches<E extends { to: string }>(
  emails: E[],
  idempotencyPrefix: string,
  toPayload: (from: string, e: E) => Payload
): Promise<{ sent: string[]; failed: string[] }> {
  const client = getResend();
  if (!client) return { sent: [], failed: emails.map((e) => e.to) };

  const result = { sent: [] as string[], failed: [] as string[] };
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const payload = chunk.map((e) => toPayload(client.from, e));
    const idempotencyKey = `${idempotencyPrefix}/chunk-${i / BATCH_SIZE}`;

    let ok = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { error } = await client.resend.batch.send(payload, { idempotencyKey });
      if (!error) {
        ok = true;
        break;
      }
      console.error(
        `Failed to send ${idempotencyPrefix} batch (attempt ${attempt + 1}):`,
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

/** 日程調整の案内を一括送信する */
export function sendScheduleInvitations(emails: ScheduleInvitationEmail[], requestId: string) {
  return sendInBatches(emails, `batch-reward-schedule/${requestId}`, invitationPayload);
}

/** 掲載者が見た目を確かめるための1通（リンクはプレビュー用で回答はできない） */
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

const RANKS = ["第1希望", "第2希望", "第3希望"];

const slotLine = (s: { startsAt: string; note: string }, durationMinutes: number | null) =>
  `${formatSlotTime(s.startsAt, durationMinutes)}${s.note ? `（${s.note}）` : ""}`;

/** 支援者が希望を回答・変更したときの控え。失敗しても回答は保存済みなので握りつぶす */
export async function sendScheduleReceipt(e: ScheduleReceiptEmail): Promise<void> {
  const client = getResend();
  if (!client) return;

  const prefs = e.preferences.map(
    (s, i) => `${RANKS[i] ?? `第${i + 1}希望`}: ${slotLine(s, e.durationMinutes)}`
  );
  const lead = `「${e.projectTitle}」の${e.scheduleTitle}について、以下の内容でご希望を受け付けました。掲載者が日程を決めたら、あらためてメールでお知らせします。`;

  const details = box(
    `<div style="font-weight:bold;">${escapeHtml(e.scheduleTitle)}</div>
     ${
       prefs.length > 0
         ? `<div style="margin-top:8px;">${prefs.map((l) => `<div>・${escapeHtml(l)}</div>`).join("")}</div>`
         : ""
     }${
       e.otherText
         ? `<div style="margin-top:8px;">その他のご希望:<br />${multiline(e.otherText)}</div>`
         : ""
     }${e.answers
       .map(
         (a) =>
           `<div style="margin-top:8px;">${escapeHtml(a.label)}:<br />${multiline(a.value)}</div>`
       )
       .join("")}`
  );

  const inner = `
    <p style="margin:0;color:${INK_SOFT};font-size:15px;line-height:1.8;">
      ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
      ${escapeHtml(lead)}
    </p>
    ${details}
    ${button(e.url, "回答を確認・変更する")}`;

  const text = [
    e.nickname ? `${e.nickname} さん` : null,
    lead,
    "",
    ...prefs.map((l) => `・${l}`),
    e.otherText ? `その他のご希望:\n${e.otherText}` : null,
    ...e.answers.map((a) => `${a.label}:\n${a.value}`),
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
    subject: singleLine(`【${e.projectTitle}】${e.scheduleTitle}のご希望を受け付けました`),
    html: layout("ご希望を受け付けました", inner),
    text,
  });
  if (error) console.error("Failed to send schedule receipt:", error.message);
}

function confirmationPayload(from: string, e: ScheduleConfirmationEmail): Payload {
  const lines = e.slots.map((s) => slotLine(s, e.durationMinutes));
  const confirmed = lines.length > 0;
  const reanswer = !confirmed && e.canReanswer;

  const subject = singleLine(
    confirmed
      ? `【${e.projectTitle}】${e.scheduleTitle}の日程が決まりました`
      : reanswer
        ? `【${e.projectTitle}】${e.scheduleTitle}の日程を取り消しました。ご希望をあらためてお知らせください`
        : `【${e.projectTitle}】${e.scheduleTitle}の日程を取り消しました`
  );
  const lead = confirmed
    ? `「${e.projectTitle}」の${e.scheduleTitle}について、日程が以下のとおり決まりました。`
    : reanswer
      ? `「${e.projectTitle}」の${e.scheduleTitle}について、お知らせしていた日程を取り消しました。お手数ですが、下のボタンからあらためてご希望の日程（第3希望まで）をお知らせください。`
      : `「${e.projectTitle}」の${e.scheduleTitle}について、お知らせしていた日程を取り消しました。あらためて掲載者からご連絡します。`;
  const deadline = reanswer && e.deadline ? `回答期限: ${formatDeadline(e.deadline)}` : null;
  const buttonLabel = reanswer ? "希望の日程を選び直す" : "内容を確認する";

  const details = confirmed
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
    : deadline
      ? box(`<div style="color:${ACCENT};font-weight:bold;">${escapeHtml(deadline)}</div>`)
      : "";

  const inner = `
    <p style="margin:0;color:${INK_SOFT};font-size:15px;line-height:1.8;">
      ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
      ${escapeHtml(lead)}
    </p>
    ${details}
    ${button(e.url, buttonLabel)}`;

  const text = [
    e.nickname ? `${e.nickname} さん` : null,
    lead.replace("下のボタンから", "下のリンクから"),
    ...lines.map((l) => `・${l}`),
    confirmed && e.location ? `場所・参加方法:\n${e.location}` : null,
    deadline,
    "",
    `${buttonLabel}: ${e.url}`,
    "",
    SITE_NAME,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    from,
    to: [e.to],
    subject,
    html: layout(confirmed ? "日程が決まりました" : "日程を取り消しました", inner),
    text,
  };
}

/** 掲載者が確定（変更・取り消し）した日程のお知らせを一括送信する */
export function sendScheduleConfirmations(emails: ScheduleConfirmationEmail[], requestId: string) {
  return sendInBatches(emails, `batch-reward-schedule-confirm/${requestId}`, confirmationPayload);
}

export const schedulePageUrl = (token: string) => `${SITE_URL}/schedule/${token}`;
