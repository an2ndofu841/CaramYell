"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import SchedulePicker from "@/components/schedule/SchedulePicker";
import type { ScheduleBookingView, ScheduleQuestion } from "@/types";

type PreviewInput = {
  projectTitle: string;
  rewardTitle: string;
  title: string;
  description: string;
  durationMinutes: number | null;
  deadline: string | null;
  allowOther: boolean;
  questions: ScheduleQuestion[];
  slots: ScheduleBookingView["slots"];
};

/** 掲載者が作っている内容を、支援者の回答画面の形にする */
export function buildPreviewView(p: PreviewInput): ScheduleBookingView {
  return {
    project: { title: p.projectTitle, path: "#" },
    rewardTitle: p.rewardTitle,
    schedule: {
      title: p.title.trim() || "（タイトル未入力）",
      description: p.description.trim(),
      location: null,
      durationMinutes: p.durationMinutes,
      deadline: p.deadline,
      status: "open",
      allowOther: p.allowOther,
      questions: p.questions.filter((q) => q.label.trim()),
    },
    slots: [...p.slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    name: "",
    tickets: 1,
    submittedAt: null,
    preferredSlotIds: [],
    otherText: "",
    answers: {},
    slotIds: [],
    message: "",
    canChange: true,
    cancelled: false,
  };
}

/** 支援者の回答画面のプレビュー（実際に操作できるが、送信はしない） */
export default function SchedulePreviewModal({
  view,
  onClose,
}: {
  view: ScheduleBookingView;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="支援者の回答画面のプレビュー"
        className="relative w-full max-w-xl my-8 rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-line bg-caramel-50 px-5 py-3">
          <p className="text-xs font-bold text-caramel-700">
            プレビュー: 支援者にはこう表示されます。選んだり入力したりできますが、送信はされません
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 text-ink-muted hover:text-ink flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 sm:p-8">
          <SchedulePicker preview={view} />
        </div>
      </div>
    </div>
  );
}
