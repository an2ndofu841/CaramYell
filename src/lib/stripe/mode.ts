/**
 * 決済キーが今の環境で使えるかどうかを見る。
 *
 * 本番デプロイにテストキーが残っていると、支援者には決済が完了したように
 * 見えるのに一円も動かない。気付くのは入金が無いと分かってからで手遅れなので、
 * 本番ではテストキーを弾いて決済導線ごと止める。
 */
export type StripeKeyCheck = { ok: true } | { ok: false; reason: string };

export function checkStripeKey(): StripeKeyCheck {
  const key = process.env.STRIPE_SECRET_KEY;

  // 制限付きキー（rk_）も受け付ける。決済に必要な権限だけを持たせられる
  if (!key || !/^(sk|rk)_/.test(key)) {
    return {
      ok: false,
      reason: "決済が未設定です。STRIPE_SECRET_KEY を設定してください。",
    };
  }

  // プレビューデプロイはテストキーのままで良いので、本番だけを対象にする
  if (process.env.VERCEL_ENV === "production" && key.includes("_test_")) {
    return {
      ok: false,
      reason:
        "本番環境にテスト用の STRIPE_SECRET_KEY が設定されています。live キーに差し替えてください。",
    };
  }

  return { ok: true };
}
