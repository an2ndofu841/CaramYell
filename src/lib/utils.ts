import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProjectStats } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "JPY",
  locale = "ja-JP"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ja-JP").format(num);
}

export function calcProjectStats(project: {
  goal_amount: number;
  current_amount: number;
  backer_count: number;
  end_date?: string;
}): ProjectStats {
  const progress_percentage = Math.min(
    Math.round((project.current_amount / project.goal_amount) * 100),
    100
  );

  const days_left = project.end_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(project.end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const is_funded = project.current_amount >= project.goal_amount;

  const average_backing =
    project.backer_count > 0
      ? Math.round(project.current_amount / project.backer_count)
      : 0;

  return { progress_percentage, days_left, is_funded, average_backing };
}

export function calcFee(amount: number): {
  base: number;
  fee: number;
  total: number;
} {
  const fee = Math.round(amount * 0.1);
  return {
    base: amount,
    fee,
    total: amount + fee,
  };
}

export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Math.random().toString(36).substr(2, 6)
  );
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 30) return `${days}日前`;
  return date.toLocaleDateString("ja-JP");
}

export function isRewardAvailable(reward: {
  quantity_total?: number | null;
  quantity_claimed: number;
}): boolean {
  if (!reward.quantity_total) return true;
  return reward.quantity_claimed < reward.quantity_total;
}

export function getStatusLabel(status: string): {
  label: string;
  color: string;
} {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "gray" },
    reviewing: { label: "審査中", color: "yellow" },
    active: { label: "掲載中", color: "green" },
    funded: { label: "目標達成！", color: "pink" },
    failed: { label: "終了", color: "red" },
    completed: { label: "完了", color: "blue" },
    cancelled: { label: "キャンセル", color: "gray" },
  };
  return map[status] || { label: status, color: "gray" };
}
