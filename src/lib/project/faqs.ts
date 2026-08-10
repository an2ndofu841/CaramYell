import type { ProjectFaq } from "@/types";

/**
 * 掲載者が書くよくある質問の受け入れ条件。
 *
 * JSONB にそのまま入るので、画面を介さず API を叩かれた場合に
 * 際限なく詰め込まれないよう、件数も長さもここで刈り込む。
 */
export const FAQ_LIMITS = {
  items: 20,
  question: 200,
  answer: 2000,
} as const;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const optional = (value: unknown, max: number): string | undefined => {
  const text = clip(value, max);
  return text === "" ? undefined : text;
};

/**
 * 任意の入力を保存できる形に整える。
 * 質問と回答が両方そろっていないものは捨てる（片方だけ出しても読めないため）。
 * 有効な項目が1つも無ければ null を返し、列を空のままにする。
 */
export function resolveFaqs(input: unknown): ProjectFaq[] | null {
  if (!Array.isArray(input)) return null;

  const items: ProjectFaq[] = [];
  for (const raw of input.slice(0, FAQ_LIMITS.items)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;

    const q = clip(item.q, FAQ_LIMITS.question);
    const a = clip(item.a, FAQ_LIMITS.answer);
    if (!q || !a) continue;

    items.push({
      q,
      a,
      q_en: optional(item.q_en, FAQ_LIMITS.question),
      a_en: optional(item.a_en, FAQ_LIMITS.answer),
    });
  }

  return items.length > 0 ? items : null;
}
