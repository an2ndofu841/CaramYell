/**
 * Supabase Auth が送る認証メールのテンプレート。
 *
 * Supabase 側の設定なのでアプリからは呼ばれない。ここで組み立てて
 * scripts/apply-supabase-auth.ts から Management API で流し込む。
 * `{{ .ConfirmationURL }}` などは Supabase が差し込む変数。
 */

const SITE_NAME = "CaramYell";
const SITE_URL = "https://www.caramyell.com";

type Template = {
  emoji: string;
  heading: string;
  body: string;
  buttonLabel: string;
  footnote: string;
  /** verifyOtp に渡す種別 */
  type: "signup" | "invite" | "magiclink" | "recovery" | "email_change";
  /** 認証後の遷移先 */
  next: string;
};

function render(t: Template): string {
  // 既定の {{ .ConfirmationURL }} はトークンをフラグメントで返すので
  // サーバー側で検証できない。token_hash を自前の受け口に渡す。
  const url = `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${t.type}&next=${encodeURIComponent(t.next)}`;

  return `<!DOCTYPE html>
<html lang="ja">
<body style="margin:0;padding:0;background:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#F2807B,#F5A34B);padding:28px 28px 24px;text-align:center;">
              <div style="font-size:34px;line-height:1;">${t.emoji}</div>
              <div style="color:#ffffff;font-size:19px;font-weight:bold;padding-top:10px;">${t.heading}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 22px;color:#5C4A3A;font-size:15px;line-height:1.8;">${t.body}</p>

              <p style="margin:0;text-align:center;">
                <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#F2807B,#F5A34B);color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 34px;border-radius:999px;">${t.buttonLabel}</a>
              </p>

              <p style="margin:22px 0 0;color:#A89685;font-size:12px;line-height:1.8;">
                ボタンが開けない場合は、次のURLをブラウザに貼り付けてください。<br />
                <a href="${url}" style="color:#C96A1B;word-break:break-all;">${url}</a>
              </p>

              <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #FFDFAE;color:#A89685;font-size:12px;line-height:1.8;">
                ${t.footnote}<br />
                このメールは送信専用です。
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:#BFAE9C;font-size:12px;">
          <a href="${SITE_URL}" style="color:#BFAE9C;text-decoration:none;">${SITE_NAME}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const LINK_EXPIRY = "このリンクの有効期限は24時間です。";

export const templates = {
  confirmation: {
    subject: `【${SITE_NAME}】メールアドレスの確認をお願いします`,
    content: render({
      emoji: "🍬",
      heading: `${SITE_NAME}へようこそ！`,
      body: "下のボタンからメールアドレスを確認すると、登録が完了します。",
      buttonLabel: "メールアドレスを確認する",
      footnote: `${LINK_EXPIRY} お心当たりがない場合は、このメールを破棄してください。`,
      type: "signup",
      next: "/dashboard",
    }),
  },
  recovery: {
    subject: `【${SITE_NAME}】パスワードの再設定`,
    content: render({
      emoji: "🔑",
      heading: "パスワードを再設定します",
      body: "下のボタンから新しいパスワードを設定してください。",
      buttonLabel: "パスワードを再設定する",
      footnote: `${LINK_EXPIRY} 再設定を依頼していない場合は、このメールを破棄すればパスワードは変わりません。`,
      type: "recovery",
      next: "/auth/reset-password",
    }),
  },
  magicLink: {
    subject: `【${SITE_NAME}】ログイン用リンク`,
    content: render({
      emoji: "✉️",
      heading: "ログインリンクが届きました",
      body: "下のボタンを押すと、パスワードなしでログインできます。",
      buttonLabel: "ログインする",
      footnote: `${LINK_EXPIRY} お心当たりがない場合は、このメールを破棄してください。`,
      type: "magiclink",
      next: "/dashboard",
    }),
  },
  emailChange: {
    subject: `【${SITE_NAME}】新しいメールアドレスの確認`,
    content: render({
      emoji: "📮",
      heading: "メールアドレスの変更",
      body: "新しいメールアドレスを確認すると、変更が完了します。",
      buttonLabel: "新しいアドレスを確認する",
      footnote: `${LINK_EXPIRY} 変更を依頼していない場合は、このメールを破棄してください。`,
      type: "email_change",
      next: "/dashboard/settings",
    }),
  },
  invite: {
    subject: `【${SITE_NAME}】アカウントへの招待`,
    content: render({
      emoji: "🎁",
      heading: `${SITE_NAME}に招待されました`,
      body: "下のボタンからアカウントを作成してください。",
      buttonLabel: "アカウントを作成する",
      footnote: `${LINK_EXPIRY} お心当たりがない場合は、このメールを破棄してください。`,
      type: "invite",
      next: "/dashboard",
    }),
  },
};
