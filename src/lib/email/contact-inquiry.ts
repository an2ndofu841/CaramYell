import { Resend } from "resend";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/config/site";

export type ContactInquiry = {
  name: string;
  email: string;
  categoryLabel: string;
  projectUrl: string | null;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 件名やヘッダーに入れる値から改行を落とす（ヘッダー継ぎ足し対策） */
function singleLine(value: string, max = 120): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function renderHtml(inquiry: ContactInquiry): string {
  const rows: [string, string][] = [
    ["種別", inquiry.categoryLabel],
    ["お名前", inquiry.name],
    ["メールアドレス", inquiry.email],
  ];
  if (inquiry.projectUrl) rows.push(["対象のプロジェクト", inquiry.projectUrl]);

  const table = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#8A7767;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#5C4A3A;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<body style="margin:0;padding:24px;background:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
    <p style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#5C4A3A;">お問い合わせが届きました</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${table}</table>
    <div style="margin-top:18px;padding-top:16px;border-top:1px solid #FFDFAE;">
      <p style="margin:0;color:#5C4A3A;font-size:14px;line-height:1.9;white-space:pre-wrap;">${escapeHtml(inquiry.message)}</p>
    </div>
    <p style="margin:20px 0 0;color:#A89685;font-size:12px;">このメールに返信すると、送信者に直接返信できます。</p>
  </div>
</body>
</html>`;
}

function renderText(inquiry: ContactInquiry): string {
  return [
    "お問い合わせが届きました",
    "",
    `種別: ${inquiry.categoryLabel}`,
    `お名前: ${inquiry.name}`,
    `メールアドレス: ${inquiry.email}`,
    inquiry.projectUrl ? `対象のプロジェクト: ${inquiry.projectUrl}` : null,
    "",
    inquiry.message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * 問い合わせ内容を運営の受付アドレスへ転送する。
 * 送信できたかどうかを呼び出し元に返し、失敗時は直接メールしてもらう案内に切り替える。
 */
export async function sendContactInquiry(
  inquiry: ContactInquiry,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!apiKey || !domain) {
    console.warn(
      "Skipping contact inquiry: RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set",
    );
    return false;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${SITE_NAME} お問い合わせ <no-reply@${domain}>`,
    to: [SUPPORT_EMAIL],
    replyTo: inquiry.email,
    subject: `[お問い合わせ/${singleLine(inquiry.categoryLabel, 40)}] ${singleLine(inquiry.name, 60)} 様`,
    html: renderHtml(inquiry),
    text: renderText(inquiry),
  });

  if (error) {
    console.error("Failed to send contact inquiry:", error.message);
    return false;
  }
  return true;
}
