/**
 * ポイントカード向け v1 API の公開 JSON が、秘密列を混ぜず
 * 達成状況と支援 URL を正しく出すかを確認する。
 *
 *   npx tsx scripts/check-partner-project-dto.ts
 */

import { NextRequest } from "next/server";
import {
  V1_MAX_IDS,
  parseProjectIds,
} from "../src/lib/api/v1/public-projects";
import {
  serializePartnerProject,
  type V1ProjectSource,
} from "../src/lib/api/v1/serialize-project";
import { GET as getProject, OPTIONS as optionsProject } from "../src/app/api/v1/projects/[id]/route";
import { GET as listProjects, OPTIONS as optionsList } from "../src/app/api/v1/projects/route";

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) console.log(`     expected ${JSON.stringify(expected)}`);
};

function collectKeys(value: unknown, acc: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      acc.push(key);
      collectKeys(nested, acc);
    }
  }
  return acc;
}

const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
const past = new Date(Date.now() - 60_000).toISOString();

const base = (overrides: Partial<V1ProjectSource> = {}): V1ProjectSource => ({
  id: "11111111-1111-1111-1111-111111111111",
  slug: "group-campaign",
  title: "グループの新作",
  tagline: "一緒に届けたい",
  description: "概要です",
  story: "本文です",
  title_en: "",
  goal_amount: 1_000_000,
  current_amount: 420_000,
  backer_count: 87,
  currency: "JPY",
  status: "active",
  main_image_url: "https://example.com/main.jpg",
  images: ["https://example.com/1.jpg"],
  start_date: "2026-01-01T00:00:00+09:00",
  end_date: future,
  tags: ["music"],
  profiles: { display_name: "掲載者", avatar_url: null },
  categories: { slug: "music", name_ja: "音楽", name_en: "Music" },
  project_milestones: [
    { id: "m1", amount: 1_000_000, title: "基本目標", sort_order: 0 },
    { id: "m2", amount: 2_000_000, title: "ネクスト", sort_order: 1 },
  ],
  rewards: [
    {
      id: "r1",
      title: "音源",
      description: "DLカード",
      amount: 3000,
      quantity_total: 100,
      quantity_claimed: 12,
      reward_type: "digital",
      sort_order: 0,
      digital_delivery_info: "https://secret.example/deliver",
    },
  ],
  ...overrides,
});

const active = serializePartnerProject(base());
check("達成率は四捨五入", active.percent, 42);
check("募集中は支援できる", active.can_back, true);
check("詳細URL", active.urls.detail.endsWith("/projects/group-campaign"), true);
check(
  "支援URLに utm",
  active.urls.back?.includes("/back/group-campaign") &&
    active.urls.back.includes("utm_source=partner"),
  true
);
check("基本目標は到達前", active.milestones[0]?.reached, false);
check("リターン残数", active.rewards[0]?.quantity_remaining, 88);
check("リターンも支援できる", active.rewards[0]?.can_back, true);
check(
  "リターン支援URLに reward",
  active.rewards[0]?.urls.back?.includes("reward=r1") ?? false,
  true
);

const over = serializePartnerProject(base({ current_amount: 1_200_000 }));
check("超過達成は 100 で切らない", over.percent, 120);
check("超過でも基本目標は到達", over.milestones[0]?.reached, true);
check("ネクストは未到達", over.milestones[1]?.reached, false);

const ended = serializePartnerProject(base({ end_date: past }));
check("締切後は支援できない", ended.can_back, false);
check("締切後の支援URLは null", ended.urls.back, null);
check("締切後のリターン支援URLは null", ended.rewards[0]?.urls.back, null);

const funded = serializePartnerProject(base({ status: "funded" }));
check("funded は支援ページを出さない", funded.can_back, false);
check("funded の支援URLは null", funded.urls.back, null);

const completed = serializePartnerProject(base({ status: "completed", end_date: past }));
check("completed は支援できない", completed.can_back, false);

const leaked = collectKeys(active);
check(
  "digital_delivery_info を出さない",
  leaked.includes("digital_delivery_info"),
  false
);
check("preview_token を出さない", leaked.includes("preview_token"), false);
check("rejection_reason を出さない", leaked.includes("rejection_reason"), false);
check("creator_id を出さない", leaked.includes("creator_id"), false);

const secretRow = serializePartnerProject({
  ...base(),
  // 入力に混ざっても出力キーにしない
  preview_token: "secret-preview",
  rejection_reason: "内部理由",
  creator_id: "should-not-appear",
} as V1ProjectSource);
const secretKeys = collectKeys(secretRow);
check(
  "混入した秘密列も出力しない",
  secretKeys.includes("preview_token") ||
    secretKeys.includes("rejection_reason") ||
    secretKeys.includes("creator_id"),
  false
);

const soldOut = serializePartnerProject(
  base({
    rewards: [
      {
        id: "r2",
        title: "完売",
        description: "",
        amount: 5000,
        quantity_total: 10,
        quantity_claimed: 10,
        reward_type: "physical",
        sort_order: 0,
      },
    ],
  })
);
check("完売リターンは支援できない", soldOut.rewards[0]?.can_back, false);
check("完売リターンのURLは null", soldOut.rewards[0]?.urls.back, null);

check("ids 省略はエラー", parseProjectIds(null).error, "ids を指定してください");
check("ids 空はエラー", parseProjectIds(" , ").error, "ids を指定してください");
check(
  "ids 不正はエラー",
  parseProjectIds("not valid").error,
  "ids の形式が正しくありません"
);
check(
  "ids は重複を落とす",
  parseProjectIds("group-campaign,group-campaign").ids,
  ["group-campaign"]
);
check(
  "ids は指定順",
  parseProjectIds("beta-show,group-campaign").ids,
  ["beta-show", "group-campaign"]
);
check(
  `ids は${V1_MAX_IDS}件まで`,
  parseProjectIds(Array.from({ length: V1_MAX_IDS + 1 }, (_, i) => `proj-${i}`).join(","))
    .error,
  `ids は${V1_MAX_IDS}件までです`
);

async function checkHttp() {
  const missing = await getProject(
    new NextRequest("http://localhost/api/v1/projects/not_a_slug"),
    { params: Promise.resolve({ id: "not_a_slug" }) }
  );
  check("存在しないIDは 404", missing.status, 404);
  check(
    "404 にも CORS",
    missing.headers.get("access-control-allow-origin"),
    "*"
  );
  check("404 はキャッシュしない", missing.headers.get("cache-control"), "no-store");

  const invalid = await getProject(
    new NextRequest("http://localhost/api/v1/projects/x"),
    { params: Promise.resolve({ id: "x" }) }
  );
  check("短すぎるIDも 404", invalid.status, 404);

  const listed = await listProjects(
    new NextRequest("http://localhost/api/v1/projects")
  );
  check("ids なしの一覧は 400", listed.status, 400);

  const badIds = await listProjects(
    new NextRequest("http://localhost/api/v1/projects?ids=@@@")
  );
  check("不正 ids は 400", badIds.status, 400);

  const preflight = optionsProject();
  check("詳細 OPTIONS は 204", preflight.status, 204);
  check(
    "OPTIONS に CORS",
    preflight.headers.get("access-control-allow-origin"),
    "*"
  );
  check("一覧 OPTIONS は 204", optionsList().status, 204);
}

checkHttp()
  .then(() => {
    console.log(failed === 0 ? "\nすべて通過" : `\n${failed} 件失敗`);
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
