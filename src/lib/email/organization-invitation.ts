import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import { singleLine } from "@/lib/email/digital-reward";
import type { OrganizationRole } from "@/types";

export type OrganizationInvitationEmail = {
  to: string;
  organizationName: string;
  inviterName: string | null;
  role: OrganizationRole;
  token: string;
  expiresAt: string;
};

// メールの配色。サイトと同じく白地・墨色の文字・アクセントはキャラメル1色に絞る
const INK = "#1C1917";
const INK_SOFT = "#44403C";
const INK_MUTED = "#78716C";
const LINE = "#E7E2DC";
const ACCENT = "#9A5A2A";

const ROLE_LABEL: Record<OrganizationRole, string> = {
  owner: "オーナー",
  staff: "スタッフ",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const inviteUrl = (token: string) => `${SITE_URL}/invite/${token}`;

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lead(e: OrganizationInvitationEmail): string {
  const who = e.inviterName ? `${e.inviterName} さんから、` : "";
  return `${who}${SITE_NAME} の「${e.organizationName}」に${ROLE_LABEL[e.role]}として招待されました。`;
}

function renderHtml(e: OrganizationInvitationEmail): string {
  const url = inviteUrl(e.token);
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
              <div style="color:${INK};font-size:20px;font-weight:bold;padding-top:14px;">事務所への招待</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;">
              <p style="margin:0 0 20px;color:${INK_SOFT};font-size:15px;line-height:1.8;">${escapeHtml(lead(e))}</p>
              <p style="margin:0 0 24px;color:${INK_SOFT};font-size:14px;line-height:1.8;">参加すると、事務所のプロジェクトの編集や支援者の管理ができるようになります。このメールアドレス（${escapeHtml(e.to)}）のアカウントでログインして参加してください。</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${INK};border-radius:8px;">
                    <a href="${url}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">招待を確認する</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;">ボタンが開けない場合: <a href="${url}" style="color:${ACCENT};word-break:break-all;">${url}</a></p>
              <p style="margin:8px 0 0;color:${INK_MUTED};font-size:12px;line-height:1.8;">有効期限: ${escapeHtml(formatExpiry(e.expiresAt))}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid ${LINE};color:${INK_MUTED};font-size:12px;line-height:1.7;">
              心当たりがない場合は、このメールを破棄してください。招待を受けなければ何も変わりません。<br />このメールは送信専用です。
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(e: OrganizationInvitationEmail): string {
  return [
    lead(e),
    "",
    "参加すると、事務所のプロジェクトの編集や支援者の管理ができるようになります。",
    `このメールアドレス（${e.to}）のアカウントでログインして、次のリンクから参加してください。`,
    "",
    inviteUrl(e.token),
    "",
    `有効期限: ${formatExpiry(e.expiresAt)}`,
    "",
    "心当たりがない場合は、このメールを破棄してください。招待を受けなければ何も変わりません。",
    "このメールは送信専用です。",
    SITE_NAME,
  ].join("\n");
}

/** 送れたら true。メールの設定が無い環境では false を返す */
export async function sendOrganizationInvitation(
  e: OrganizationInvitationEmail
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!apiKey || !domain) {
    console.warn("Skipping organization invitation: RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set");
    return false;
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: `${SITE_NAME} <no-reply@${domain}>`,
    to: [e.to],
    subject: singleLine(`「${e.organizationName}」への招待が届いています`),
    html: renderHtml(e),
    text: renderText(e),
  });
  if (error) {
    console.error("[email] organization invitation failed", error);
    return false;
  }
  return true;
}
