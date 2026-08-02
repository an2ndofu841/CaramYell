/**
 * 手数料の定義。
 *
 * 掲載者からは徴収せず、出資者の支払いに上乗せする形で頂く。
 * 率は決済金額の計算・Stripe の明細・確認メール・料金説明の各所に出るので、
 * 表記がずれないようにここだけを見るようにしている。
 */

/** 出資者に上乗せするサービス手数料の率 */
export const BACKER_FEE_RATE = 0.08;

/** 文言に出す百分率（8% の 8） */
export const BACKER_FEE_PERCENT = Math.round(BACKER_FEE_RATE * 100);

/** 円未満は出せないので四捨五入する */
export function calcBackerFee(amount: number): number {
  return Math.round(amount * BACKER_FEE_RATE);
}

/** 料金説明で使う計算例。率を変えたときに例だけ古くならないよう導出する */
export function feeExample(base: number) {
  const fee = calcBackerFee(base);
  return {
    base,
    fee,
    total: base + fee,
    baseText: base.toLocaleString("ja-JP"),
    feeText: fee.toLocaleString("ja-JP"),
    totalText: (base + fee).toLocaleString("ja-JP"),
  };
}
