import {
  campaignEndFromInput,
  isCampaignOver,
  jstDateAfterDays,
} from "../src/lib/date/campaign-end";

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) console.log(`     expected ${JSON.stringify(expected)}`);
};

// 日付だけの入力は、その日の日本時間 23:59:59 を指す
check(
  "date only",
  campaignEndFromInput("2026-08-24"),
  "2026-08-24T23:59:59.999+09:00"
);
check(
  "date only は UTC では同じ日の 14:59",
  new Date(campaignEndFromInput("2026-08-24")!).toISOString(),
  "2026-08-24T14:59:59.999Z"
);
// 保存後に画面へ戻したときも同じ日付に戻る（下書き再開で日付欄に入れ直す経路）
check(
  "往復しても日付は変わらない",
  new Date(campaignEndFromInput("2026-08-24")!).toISOString().slice(0, 10),
  "2026-08-24"
);
check("空文字は null", campaignEndFromInput(""), null);
check("null は null", campaignEndFromInput(null), null);
check(
  "時刻つきはそのまま通す",
  campaignEndFromInput("2026-08-24T10:00:00+00:00"),
  "2026-08-24T10:00:00+00:00"
);

// 締切判定
const past = new Date(Date.now() - 60_000).toISOString();
const future = new Date(Date.now() + 60_000).toISOString();
check("過去は終了", isCampaignOver(past), true);
check("未来は継続中", isCampaignOver(future), false);
check("未設定は継続中", isCampaignOver(null), false);

// 8/24 締切のプロジェクトが 24 日の各時刻でどう見えるか
const end = new Date(campaignEndFromInput("2026-08-24")!).getTime();
const jst = (iso: string) => new Date(iso).getTime();
check("8/24 09:00 JST はまだ支援できる", end > jst("2026-08-24T09:00:00+09:00"), true);
check("8/24 23:59 JST はまだ支援できる", end > jst("2026-08-24T23:59:00+09:00"), true);
check("8/25 00:00 JST は終了", end > jst("2026-08-25T00:00:00+09:00"), false);

// 日付欄の最小値は日本時間基準
check(
  "jstDateAfterDays は YYYY-MM-DD",
  /^\d{4}-\d{2}-\d{2}$/.test(jstDateAfterDays(7)),
  true
);

console.log(failed === 0 ? "\nすべて通過" : `\n${failed} 件失敗`);
process.exit(failed === 0 ? 0 : 1);
