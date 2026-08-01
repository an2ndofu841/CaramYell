/**
 * Supabase Auth のメール設定を Management API でまとめて反映する。
 *
 * 組み込みメールは1時間2通の制限があり、登録が重なると認証メールが届かない。
 * 送信を Resend の SMTP に寄せて、テンプレートも CaramYell のものに差し替える。
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npx tsx --env-file=.env.local \
 *     scripts/apply-supabase-auth.ts
 */

import { templates } from "./auth-email-templates";

const PROJECT_REF = "jejlaqvwauejhofkqjpa";
const SITE_URL = "https://www.caramyell.com";

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const smtpPass = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;

  if (!accessToken) throw new Error("SUPABASE_ACCESS_TOKEN が未設定です");
  if (!smtpPass) throw new Error("RESEND_API_KEY が未設定です");
  if (!domain) throw new Error("RESEND_EMAIL_DOMAIN が未設定です");

  const config = {
    site_url: SITE_URL,
    // ?next= を付けて戻すのでワイルドカードで許可する
    uri_allow_list: [
      `${SITE_URL}/auth/callback**`,
      "https://caramyell.com/auth/callback**",
      "http://localhost:3000/auth/callback**",
    ].join(","),
    mailer_autoconfirm: false,

    external_email_enabled: true,
    smtp_admin_email: `no-reply@${domain}`,
    smtp_sender_name: "CaramYell",
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: smtpPass,
    // Resend 経由なら組み込みメーラーの 2通/時 に縛られない
    rate_limit_email_sent: 60,

    mailer_subjects_confirmation: templates.confirmation.subject,
    mailer_templates_confirmation_content: templates.confirmation.content,
    mailer_subjects_recovery: templates.recovery.subject,
    mailer_templates_recovery_content: templates.recovery.content,
    mailer_subjects_magic_link: templates.magicLink.subject,
    mailer_templates_magic_link_content: templates.magicLink.content,
    mailer_subjects_email_change: templates.emailChange.subject,
    mailer_templates_email_change_content: templates.emailChange.content,
    mailer_subjects_invite: templates.invite.subject,
    mailer_templates_invite_content: templates.invite.content,
  };

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    }
  );

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }

  console.log("Supabase Auth のメール設定を更新しました");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
