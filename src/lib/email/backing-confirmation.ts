import { Resend } from "resend";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import { formatCurrency } from "@/lib/utils";
import { getCountryFormat } from "@/lib/data/countries";

export type BackingConfirmationItem = {
  reward_title: string;
  unit_amount: number;
  quantity: number;
};

export type BackingConfirmation = {
  /** 冪等キーに使う。同じ支援で二重に送らないため */
  backerId: string;
  to: string;
  nickname?: string | null;
  projectTitle: string;
  projectPath: string;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  items: BackingConfirmationItem[];
  address: Record<string, string> | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAddress(address: Record<string, string> | null): string | null {
  if (!address) return null;
  const format = getCountryFormat(address.country);
  const parts = format.fields.map((f) => address[f.key]).filter(Boolean);
  if (parts.length === 0) return null;
  const postal = address.postal_code ? `〒${address.postal_code} ` : "";
  const country =
    address.country && address.country !== "JP" ? ` (${address.country})` : "";
  return `${postal}${parts.join(" ")}${country}`;
}

function buildLines(c: BackingConfirmation): [string, string][] {
  const lines: [string, string][] = c.items.map((it) => [
    `${it.reward_title} × ${it.quantity}`,
    formatCurrency(it.unit_amount * it.quantity),
  ]);
  const itemsTotal = c.items.reduce(
    (sum, it) => sum + it.unit_amount * it.quantity,
    0
  );
  // リターンなしの応援や、リターンに上乗せした自由応援額
  if (c.amount > itemsTotal) {
    lines.push(["応援金額", formatCurrency(c.amount - itemsTotal)]);
  }
  lines.push(["手数料（10%）", formatCurrency(c.feeAmount)]);
  return lines;
}

function renderHtml(c: BackingConfirmation): string {
  const projectUrl = `${SITE_URL}${c.projectPath}`;
  const address = formatAddress(c.address);
  const rows = buildLines(c)
    .map(
      ([label, value]) => `
            <tr>
              <td style="padding:6px 0;color:#5C4A3A;font-size:14px;">${escapeHtml(label)}</td>
              <td style="padding:6px 0;color:#5C4A3A;font-size:14px;text-align:right;white-space:nowrap;">${escapeHtml(value)}</td>
            </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<body style="margin:0;padding:0;background:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#F2807B,#F5A34B);padding:28px 28px 24px;text-align:center;">
              <div style="font-size:34px;line-height:1;">🎉</div>
              <div style="color:#ffffff;font-size:19px;font-weight:bold;padding-top:10px;">応援ありがとうございます！</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 18px;color:#5C4A3A;font-size:15px;line-height:1.8;">
                ${c.nickname ? `${escapeHtml(c.nickname)} さん<br />` : ""}
                「${escapeHtml(c.projectTitle)}」へのご支援を受け付けました。
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:14px;padding:16px;">
                <tr><td>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
                    <tr><td colspan="2" style="border-top:1px solid #FFDFAE;padding-top:10px;"></td></tr>
                    <tr>
                      <td style="color:#5C4A3A;font-size:15px;font-weight:bold;">お支払い合計</td>
                      <td style="color:#C96A1B;font-size:17px;font-weight:bold;text-align:right;white-space:nowrap;">${escapeHtml(formatCurrency(c.totalAmount))}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              ${
                address
                  ? `<p style="margin:18px 0 0;color:#8A7767;font-size:13px;line-height:1.8;">
                <strong style="color:#5C4A3A;">お届け先</strong><br />${escapeHtml(address)}
              </p>`
                  : ""
              }

              <p style="margin:22px 0 0;text-align:center;">
                <a href="${projectUrl}" style="display:inline-block;background:linear-gradient(135deg,#F2807B,#F5A34B);color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 30px;border-radius:999px;">プロジェクトを見る</a>
              </p>

              <p style="margin:22px 0 0;color:#A89685;font-size:12px;line-height:1.8;">
                リターンの発送や進捗は、プロジェクトページの活動報告でお知らせします。<br />
                このメールは送信専用です。お問い合わせはプロジェクトページからお願いします。
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:#BFAE9C;font-size:12px;">${SITE_NAME}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(c: BackingConfirmation): string {
  const address = formatAddress(c.address);
  const lines = buildLines(c).map(([label, value]) => `${label}: ${value}`);
  return [
    "応援ありがとうございます！",
    "",
    c.nickname ? `${c.nickname} さん` : null,
    `「${c.projectTitle}」へのご支援を受け付けました。`,
    "",
    ...lines,
    `お支払い合計: ${formatCurrency(c.totalAmount)}`,
    address ? `\nお届け先: ${address}` : null,
    "",
    `プロジェクトページ: ${SITE_URL}${c.projectPath}`,
    "",
    "リターンの発送や進捗は、プロジェクトページの活動報告でお知らせします。",
    "このメールは送信専用です。",
    SITE_NAME,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * 支援完了メールを支援者に送る。
 * 決済の記録は済んでいるので、送信に失敗しても支援自体は失敗させない。
 */
export async function sendBackingConfirmation(
  confirmation: BackingConfirmation
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!apiKey || !domain) {
    console.warn(
      "Skipping backing confirmation: RESEND_API_KEY or RESEND_EMAIL_DOMAIN is not set"
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send(
    {
      from: `${SITE_NAME} <no-reply@${domain}>`,
      to: [confirmation.to],
      subject: `ご支援ありがとうございます — ${confirmation.projectTitle}`,
      html: renderHtml(confirmation),
      text: renderText(confirmation),
    },
    // webhook と成功ページの両方から呼ばれても1通に収める
    { idempotencyKey: `backing-confirmation/${confirmation.backerId}` }
  );

  if (error) {
    console.error("Failed to send backing confirmation:", error.message);
  }
}
