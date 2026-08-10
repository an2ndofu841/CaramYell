"use client";

import { ChevronDown, ChevronUp, HelpCircle, Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import EnglishPanel from "@/components/project/EnglishPanel";
import { FAQ_LIMITS } from "@/lib/project/faqs";
import type { ProjectFaq } from "@/types";

/**
 * 掲載者が書くよくある質問の編集欄。作成ウィザードと管理画面で共用する。
 *
 * 質問と回答が両方そろっている項目だけが保存される（API 側でも同じ判定）。
 */
export default function FaqEditor({
  items,
  onChange,
}: {
  items: ProjectFaq[];
  onChange: (items: ProjectFaq[]) => void;
}) {
  const update = (index: number, patch: Partial<ProjectFaq>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  // 並び順がそのまま表示順になるので、入れ替えられるようにしておく
  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  const add = () => {
    if (items.length >= FAQ_LIMITS.items) return;
    onChange([...items, { q: "", a: "" }]);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <HelpCircle size={16} className="text-caramel-500" />
          よくある質問（任意）
        </p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          支援者から聞かれそうなことを先に書いておけます。ここに書いたものが、
          手数料や決済方法などの共通の質問より上に並びます。
        </p>
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border-2 border-caramel-100 bg-white p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              質問 {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="上へ"
                className="p-1.5 rounded-full text-gray-400 hover:bg-caramel-50 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="下へ"
                className="p-1.5 rounded-full text-gray-400 hover:bg-caramel-50 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="削除"
                className="p-1.5 rounded-full text-red-400 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <Input
            label="質問"
            placeholder="例：リターンの発送はいつ頃になりますか？"
            value={item.q}
            onChange={(e) => update(i, { q: e.target.value })}
            maxLength={FAQ_LIMITS.question}
            fullWidth
          />

          <Textarea
            label="回答"
            placeholder="例：2026年10月中に順次発送する予定です。遅れる場合は活動報告でお知らせします。"
            value={item.a}
            onChange={(e) => update(i, { a: e.target.value })}
            maxLength={FAQ_LIMITS.answer}
            rows={3}
            fullWidth
          />

          <EnglishPanel hasContent={Boolean(item.q_en || item.a_en)}>
            <Input
              label="Question"
              value={item.q_en || ""}
              onChange={(e) => update(i, { q_en: e.target.value })}
              maxLength={FAQ_LIMITS.question}
              fullWidth
            />
            <Textarea
              label="Answer"
              value={item.a_en || ""}
              onChange={(e) => update(i, { a_en: e.target.value })}
              maxLength={FAQ_LIMITS.answer}
              rows={3}
              fullWidth
            />
          </EnglishPanel>
        </div>
      ))}

      {items.length < FAQ_LIMITS.items && (
        <button
          type="button"
          onClick={add}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-caramel-200 text-caramel-500 text-sm font-bold hover:border-caramel-300 hover:bg-caramel-50 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          質問を追加する
        </button>
      )}
    </div>
  );
}
