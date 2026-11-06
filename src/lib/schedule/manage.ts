import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { managedBy } from "@/lib/project/access";
import { jstInputToIso } from "./time";

/** 掲載者が管理できるプロジェクトか確かめて読む */
export async function loadManagedProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      supabase,
      user: null,
      project: null,
      denied: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    } as const;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, slug")
    .eq("id", projectId)
    .or(await managedBy(supabase, user.id))
    .maybeSingle();
  if (!project) {
    return {
      supabase,
      user,
      project: null,
      denied: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    } as const;
  }
  return { supabase, user, project, denied: null } as const;
}

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

type ScheduleFields = {
  title?: string;
  description?: string;
  location?: string;
  duration_minutes?: number | null;
  deadline?: string | null;
  status?: "open" | "closed";
};

/** 日程調整の入力を検証する。partial なら渡された項目だけ見る */
export function parseScheduleFields(
  body: Record<string, unknown>,
  partial: boolean
): { fields: ScheduleFields; error: string | null } {
  const fields: ScheduleFields = {};
  const has = (k: string) => k in body;

  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return { fields, error: "タイトルを入力してください" };
    if (title.length > 100) return { fields, error: "タイトルは100文字以内で入力してください" };
    fields.title = title;
  }
  if (!partial || has("description")) {
    const v = typeof body.description === "string" ? body.description.trim() : "";
    if (v.length > 3000) return { fields, error: "案内文は3000文字以内で入力してください" };
    fields.description = v;
  }
  if (!partial || has("location")) {
    const v = typeof body.location === "string" ? body.location.trim() : "";
    if (v.length > 1000) return { fields, error: "場所・参加方法は1000文字以内で入力してください" };
    fields.location = v;
  }
  if (!partial || has("durationMinutes")) {
    const v = body.durationMinutes;
    if (v === null || v === undefined || v === "") {
      fields.duration_minutes = null;
    } else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 5 || n > 1440) {
        return { fields, error: "所要時間は5〜1440分で入力してください" };
      }
      fields.duration_minutes = n;
    }
  }
  if (!partial || has("deadline")) {
    const v = body.deadline;
    if (v === null || v === undefined || v === "") {
      fields.deadline = null;
    } else {
      const iso = jstInputToIso(v);
      if (!iso) return { fields, error: "回答期限の日時が正しくありません" };
      fields.deadline = iso;
    }
  }
  if (has("status")) {
    if (body.status !== "open" && body.status !== "closed") {
      return { fields, error: "受付状態が正しくありません" };
    }
    fields.status = body.status;
  }
  return { fields, error: null };
}

export type SlotInput = { starts_at: string; capacity: number; note: string };

export function parseSlot(
  raw: unknown,
  { partial = false }: { partial?: boolean } = {}
): { slot: Partial<SlotInput>; error: string | null } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const slot: Partial<SlotInput> = {};
  if (!partial || "startsAt" in body) {
    const iso = jstInputToIso(body.startsAt);
    if (!iso) return { slot, error: "日時が正しくありません" };
    slot.starts_at = iso;
  }
  if (!partial || "capacity" in body) {
    const n = body.capacity === undefined ? 1 : Number(body.capacity);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      return { slot, error: "定員は1〜1000人で入力してください" };
    }
    slot.capacity = n;
  }
  if (!partial || "note" in body) {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 200) return { slot, error: "枠の補足は200文字以内で入力してください" };
    slot.note = note;
  }
  return { slot, error: null };
}
