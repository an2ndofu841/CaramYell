import { absoluteUrl } from "@/lib/config/site";
import { isCampaignOver } from "@/lib/date/campaign-end";
import { calcProjectStats, isRewardAvailable } from "@/lib/utils";
import type { RewardType } from "@/types";

const UTM_SOURCE = "partner";

/**
 * ポイントカードなど外部アプリへ出す案件の形。
 * DB 行をそのまま返すと preview_token やデジタルリターンの配送情報まで
 * 混ざるので、ここで使うキーだけを明示して組み立てる。
 */
export interface V1ProjectUrls {
  detail: string;
  /** 募集中かつ締切前だけ。それ以外は null（支援ページも受け付けない） */
  back: string | null;
}

export interface V1Creator {
  display_name: string | null;
  avatar_url: string | null;
}

export interface V1Category {
  slug: string | null;
  name_ja: string | null;
  name_en: string | null;
}

export interface V1Milestone {
  id: string;
  amount: number;
  title: string;
  description: string | null;
  sort_order: number;
  reached: boolean;
}

/** まだ到達していない直近の段階ゴール。全部到達済みなら null */
export interface V1NextMilestone {
  id: string;
  title: string;
  amount: number;
  /** 到達までの残り金額 */
  remaining: number;
}

export interface V1Reward {
  id: string;
  title: string;
  description: string;
  title_en: string | null;
  description_en: string | null;
  amount: number;
  quantity_total: number | null;
  quantity_claimed: number;
  quantity_remaining: number | null;
  reward_type: RewardType;
  estimated_delivery_date: string | null;
  sort_order: number;
  can_back: boolean;
  urls: { back: string | null };
}

export interface V1Project {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  story: string | null;
  title_en: string | null;
  tagline_en: string | null;
  description_en: string | null;
  story_en: string | null;
  tags: string[];
  status: string;
  currency: string;
  /**
   * 画面に出る目標額。段階ゴールがあればその最終目標。
   * サイト側（ProjectDetailClient / ProjectCard）と同じ基準にしてある。
   */
  goal_amount: number;
  /** 基本目標（最小段階）。参考用で、達成率の分母には使わない */
  base_goal_amount: number;
  current_amount: number;
  /** goal_amount に対する達成率。サイトと同じく 100 で止める */
  percent: number;
  is_funded: boolean;
  backer_count: number;
  days_left: number;
  can_back: boolean;
  main_image_url: string | null;
  images: string[];
  video_url: string | null;
  start_date: string | null;
  end_date: string | null;
  creator: V1Creator | null;
  category: V1Category | null;
  milestones: V1Milestone[];
  next_milestone: V1NextMilestone | null;
  rewards: V1Reward[];
  urls: V1ProjectUrls;
}

type Nested<T> = T | T[] | null | undefined;

export interface V1ProjectSource {
  id: string;
  slug: string;
  title?: string | null;
  tagline?: string | null;
  description?: string | null;
  story?: string | null;
  title_en?: string | null;
  tagline_en?: string | null;
  description_en?: string | null;
  story_en?: string | null;
  tags?: string[] | null;
  status?: string | null;
  currency?: string | null;
  goal_amount?: number | null;
  current_amount?: number | null;
  backer_count?: number | null;
  main_image_url?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  profiles?: Nested<{
    display_name?: string | null;
    avatar_url?: string | null;
  }>;
  categories?: Nested<{
    slug?: string | null;
    name_ja?: string | null;
    name_en?: string | null;
  }>;
  project_milestones?: Nested<{
    id: string;
    amount?: number | null;
    title?: string | null;
    description?: string | null;
    sort_order?: number | null;
  }>;
  rewards?: Nested<{
    id: string;
    title?: string | null;
    description?: string | null;
    title_en?: string | null;
    description_en?: string | null;
    amount?: number | null;
    quantity_total?: number | null;
    quantity_claimed?: number | null;
    reward_type?: RewardType | null;
    estimated_delivery_date?: string | null;
    sort_order?: number | null;
    digital_delivery_info?: string | null;
  }>;
}

function one<T>(value: Nested<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function many<T>(value: Nested<T> | Nested<T>[]): T[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is T => item != null && !Array.isArray(item)
  );
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function backingUrl(slug: string, rewardId?: string): string {
  const params = new URLSearchParams({ utm_source: UTM_SOURCE });
  if (rewardId) params.set("reward", rewardId);
  return `${absoluteUrl(`/back/${slug}`)}?${params.toString()}`;
}

function remaining(
  total: number | null | undefined,
  claimed: number
): number | null {
  if (total == null) return null;
  return Math.max(0, total - claimed);
}

function achievementPercent(goal: number, current: number): number {
  if (goal <= 0) return 0;
  // サイト側と同じく 100 で止める。超過分は is_funded と
  // milestones[].reached で分かる
  return Math.min(Math.round((current / goal) * 100), 100);
}

/**
 * 公開案件 1 件を、外部アプリがそのまま描画できる JSON にする。
 * 入力に秘密列が混ざっていても出力のキーには載せない。
 */
export function serializePartnerProject(row: V1ProjectSource): V1Project {
  const slug = text(row.slug);
  const status = text(row.status);
  const baseGoal = Number(row.goal_amount) || 0;
  const current = Number(row.current_amount) || 0;
  const backerCount = Number(row.backer_count) || 0;
  const endDate = row.end_date ?? null;
  const canBack = status === "active" && !isCampaignOver(endDate);

  const creator = one(row.profiles);
  const category = one(row.categories);

  const milestones = many(row.project_milestones)
    .slice()
    // 金額の小さい順。最後の要素が最終目標になる
    .sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
    .map((milestone) => {
      const amount = Number(milestone.amount) || 0;
      return {
        id: milestone.id,
        amount,
        title: text(milestone.title),
        description: nullable(milestone.description),
        sort_order: Number(milestone.sort_order) || 0,
        reached: current >= amount,
      };
    });

  /**
   * 段階ゴールがある案件の goal_amount は最小段階（基本目標）なので、
   * これを分母にすると第1目標を超えた時点で達成済みに見えてしまう。
   * サイトの表示と同じく最終目標を基準にする。
   */
  const goal =
    milestones.length > 0 ? milestones[milestones.length - 1].amount : baseGoal;

  const stats = calcProjectStats({
    goal_amount: goal,
    current_amount: current,
    backer_count: backerCount,
    end_date: endDate ?? undefined,
  });

  const upcoming = milestones.find((milestone) => !milestone.reached);
  const nextMilestone = upcoming
    ? {
        id: upcoming.id,
        title: upcoming.title,
        amount: upcoming.amount,
        remaining: upcoming.amount - current,
      }
    : null;

  const rewards = many(row.rewards)
    .slice()
    .sort((a, b) => {
      const byOrder = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (byOrder !== 0) return byOrder;
      return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    })
    .map((reward) => {
      const claimed = Number(reward.quantity_claimed) || 0;
      const total =
        reward.quantity_total == null ? null : Number(reward.quantity_total);
      const available = isRewardAvailable({
        quantity_total: total,
        quantity_claimed: claimed,
      });
      const rewardCanBack = canBack && available;
      return {
        id: reward.id,
        title: text(reward.title),
        description: text(reward.description),
        title_en: nullable(reward.title_en),
        description_en: nullable(reward.description_en),
        amount: Number(reward.amount) || 0,
        quantity_total: total,
        quantity_claimed: claimed,
        quantity_remaining: remaining(total, claimed),
        reward_type: reward.reward_type || "physical",
        estimated_delivery_date: nullable(reward.estimated_delivery_date),
        sort_order: Number(reward.sort_order) || 0,
        can_back: rewardCanBack,
        urls: {
          back: rewardCanBack ? backingUrl(slug, reward.id) : null,
        },
      };
    });

  return {
    id: row.id,
    slug,
    title: text(row.title),
    tagline: text(row.tagline),
    description: text(row.description),
    story: nullable(row.story),
    title_en: nullable(row.title_en),
    tagline_en: nullable(row.tagline_en),
    description_en: nullable(row.description_en),
    story_en: nullable(row.story_en),
    tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === "string") : [],
    status,
    currency: text(row.currency) || "JPY",
    goal_amount: goal,
    base_goal_amount: baseGoal,
    current_amount: current,
    percent: achievementPercent(goal, current),
    is_funded: goal > 0 && current >= goal,
    backer_count: backerCount,
    days_left: stats.days_left,
    can_back: canBack,
    main_image_url: nullable(row.main_image_url),
    images: Array.isArray(row.images)
      ? row.images.filter((url): url is string => typeof url === "string")
      : [],
    video_url: nullable(row.video_url),
    start_date: row.start_date ?? null,
    end_date: endDate,
    creator: creator
      ? {
          display_name: nullable(creator.display_name),
          avatar_url: nullable(creator.avatar_url),
        }
      : null,
    category: category
      ? {
          slug: nullable(category.slug),
          name_ja: nullable(category.name_ja),
          name_en: nullable(category.name_en),
        }
      : null,
    milestones,
    next_milestone: nextMilestone,
    rewards,
    urls: {
      detail: absoluteUrl(`/projects/${slug}`),
      back: canBack ? backingUrl(slug) : null,
    },
  };
}
