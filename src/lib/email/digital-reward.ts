import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export type DigitalRewardEmail = {
  to: string;
  nickname?: string | null;
  projectTitle: string;
  projectPath: string;
  rewardTitle: string;
  subject: string;
  /** 掲載者が書いた本文。URL はリンクにし、改行はそのまま出す */
  message: string;
};

export type DigitalRewardSendResult = {
  sent: string[];
  failed: string[];
};

/** Resend の batch は1リクエスト100通まで */
const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 3;

// メールの配色。サイトと同じく白地・墨色の文字・アクセントはキャラメル1色に絞る
const INK = "#1C1917";
const INK_SOFT = "#44403C";
const INK_MUTED = "#78716C";
const LINE = "#E7E2DC";
const SURFACE = "#FAF8F5";
const ACCENT = "#9A5A2A";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 件名やヘッダーに入れる値から改行を落とす（ヘッダー継ぎ足し対策） */
export function singleLine(value: string, max = 120): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

/**
 * エスケープ済みの本文中の URL をリンクにする。& は &amp; のままで href として正しい。
 * 日本語では「…/dlからダウンロード」のように URL の直後に文字が続くので、
 * URL に使える半角文字だけを拾い、文末の句読点や閉じ括弧はリンクから外す。
 */
function linkify(escaped: string): string {
  return escaped.replace(
    /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g,
    (match) => {
      const url = match.replace(/[.,!?)']+$/, "");
      const rest = match.slice(url.length);
      return `<a href="${url}" style="color:${ACCENT};word-break:break-all;">${url}</a>${rest}`;
    }
  );
}

function renderHtml(e: DigitalRewardEmail): string {
  const projectUrl = `${SITE_URL}${e.projectPath}`;
  const body = linkify(escapeHtml(e.message)).replace(/\r?\n/g, "<br />");

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
              <div style="color:${INK};font-size:20px;font-weight:bold;padding-top:14px;">リターンのお届け</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;">
              <p style="margin:0 0 20px;color:${INK_SOFT};font-size:15px;line-height:1.8;">
                ${e.nickname ? `${escapeHtml(e.nickname)} さん<br />` : ""}
                「${escapeHtml(e.projectTitle)}」へのご支援ありがとうございました。<br />
                リターン「${escapeHtml(e.rewardTitle)}」をお届けします。
              </p>

              <div style="background:${SURFACE};border:1px solid ${LINE};border-radius:8px;padding:18px;color:${INK};font-size:14px;line-height:1.9;">${body}</div>

              <p style="margin:24px 0 0;">
                <a href="${projectUrl}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:8px;">プロジェクトを見る</a>
              </p>

              <p style="margin:24px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;">
                このメールは、プロジェクトの掲載者が ${escapeHtml(SITE_NAME)} から支援者の皆さまへお送りしています。<br />
                このメールは送信専用です。リターンについてのお問い合わせはプロジェクトページからお願いします。
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

function renderText(e: DigitalRewardEmail): string {
  return [
    e.nickname ? `${e.nickname} さん` : null,
    `「${e.projectTitle}」へのご支援ありがとうございました。`,
    `リターン「${e.rewardTitle}」をお届けします。`,
    "",
    e.message,
    "",
    `プロジェクトページ: ${SITE_URL}${e.projectPath}`,
    "",
    `このメールは、プロジェクトの掲載者が ${SITE_NAME} から支援者の皆さまへお送りしています。`,
    "このメールは送信専用です。",
    SITE_NAME,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!apiKey || !domain) return null;
  return { resend: new Resend(apiKey), from: `${SITE_NAME} <no-reply@${domain}>` };
}

export const isEmailConfigured = () => getResend() !== null;

function toPayload(from: string, e: DigitalRewardEmail) {
  return {
    from,
    to: [e.to],
    subject: singleLine(e.subject),
    html: renderHtml(e),
    text: renderText(e),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (name: string | undefined) =>
  name === "rate_limit_exceeded" ||
  name === "application_error" ||
  name === "internal_server_error" ||
  name === "concurrent_idempotent_requests";

/**
 * デジタルリターンの案内を支援者へ一括送信する。
 * 100通ずつに分け、塊ごとに冪等キーを付けるので、同じ requestId での再試行は二重送信にならない。
 * 失敗した塊の宛先は failed に入れて返し、呼び出し元は送れた分だけ記録する。
 */
export async function sendDigitalRewardEmails(
  emails: DigitalRewardEmail[],
  requestId: string
): Promise<DigitalRewardSendResult> {
  const client = getResend();
  if (!client) {
    console.warn("Skipping digital reward emails: RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set");
    return { sent: [], failed: emails.map((e) => e.to) };
  }

  const result: DigitalRewardSendResult = { sent: [], failed: [] };

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const payload = chunk.map((e) => toPayload(client.from, e));
    const idempotencyKey = `batch-digital-reward/${requestId}/chunk-${i / BATCH_SIZE}`;

    let ok = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { error } = await client.resend.batch.send(payload, { idempotencyKey });
      if (!error) {
        ok = true;
        break;
      }
      console.error(
        `Failed to send digital reward batch (attempt ${attempt + 1}):`,
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

/** 掲載者が本番前に見た目とリンクを確かめるための1通 */
export async function sendDigitalRewardTest(email: DigitalRewardEmail): Promise<boolean> {
  const client = getResend();
  if (!client) return false;
  const payload = toPayload(client.from, email);
  const { error } = await client.resend.emails.send({
    ...payload,
    subject: `【テスト送信】${payload.subject}`,
  });
  if (error) {
    console.error("Failed to send digital reward test:", error.message);
    return false;
  }
  return true;
}
