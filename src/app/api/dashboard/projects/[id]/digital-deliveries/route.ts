import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { dbError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { managedBy } from "@/lib/project/access";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  collectDigitalRecipients,
  isDigitalReward,
  type RewardDelivery,
} from "@/lib/project/digital-delivery";
import {
  isEmailConfigured,
  sendDigitalRewardEmails,
  sendDigitalRewardTest,
  singleLine,
} from "@/lib/email/digital-reward";
import type { Backer, Reward } from "@/types";

/**
 * デジタルリターンを、受け取る支援者へメールで一括送付する（掲載者のみ）。
 *
 * 宛先はクライアントから受け取らず、ここで支援データから組み立てる。
 * 掲載者が任意のアドレスへ CaramYell の名前でメールを送れないようにするため。
 */

export const maxDuration = 60;

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 5000;
const MAX_RECIPIENTS = 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 1000;

type Mode = "test" | "unsent" | "all";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

async function loadOwnedProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, project: null };

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, slug")
    .eq("id", id)
    .or(await managedBy(supabase, user.id))
    .maybeSingle();

  return { supabase, user, project };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function loadDeliveries(supabase: Supabase, projectId: string) {
  return supabase
    .from("reward_deliveries")
    .select("reward_id, backer_id, sent_at")
    .eq("project_id", projectId);
}

/** 既定の上限（1000行）を超える支援があっても取りこぼさないよう、ページを送って集める */
async function loadPaidBackers(supabase: Supabase, projectId: string) {
  const all: Backer[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("backers")
      .select(
        `
        id, reward_id, guest_email, guest_nickname, amount, status, created_at,
        rewards(id, title, reward_type),
        backer_items(id, reward_id, reward_title, unit_amount, quantity, needs_address)
      `
      )
      .eq("project_id", projectId)
      .eq("status", "paid")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { backers: null, error };
    all.push(...((data || []) as unknown as Backer[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { backers: all, error: null };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data, error } = await loadDeliveries(supabase, id);
  if (error) return dbError(error);

  return NextResponse.json({
    deliveries: data || [],
    emailConfigured: isEmailConfigured(),
    testEmail: user.email ?? null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, project } = await loadOwnedProject(id);
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!project) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const limit = rateLimit(`digital-delivery:${user.id}`, 10, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "メール送信の設定が完了していません。運営にお問い合わせください" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const rewardId = typeof body.rewardId === "string" ? body.rewardId : "";
  const subject = typeof body.subject === "string" ? singleLine(body.subject, MAX_SUBJECT + 1) : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const mode: Mode = ["test", "unsent", "all"].includes(body.mode) ? body.mode : "unsent";
  const requestId = typeof body.requestId === "string" ? body.requestId : "";

  if (!subject) {
    return NextResponse.json({ error: "件名を入力してください" }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT) {
    return NextResponse.json(
      { error: `件名は${MAX_SUBJECT}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json({ error: "本文を入力してください" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `本文は${MAX_MESSAGE}文字以内で入力してください` },
      { status: 400 }
    );
  }
  if (mode !== "test" && !UUID_RE.test(requestId)) {
    return NextResponse.json({ error: "送信IDが正しくありません" }, { status: 400 });
  }

  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select("id, title, amount, reward_type, needs_address")
    .eq("project_id", id);
  if (rewardsError) return dbError(rewardsError);

  const reward = (rewards || []).find((r) => r.id === rewardId);
  if (!reward || !isDigitalReward(reward)) {
    return NextResponse.json(
      { error: "送付するデジタルリターンが見つかりません" },
      { status: 400 }
    );
  }

  const base = {
    projectTitle: project.title || "プロジェクト",
    projectPath: `/projects/${project.slug || project.id}`,
    rewardTitle: reward.title,
    subject,
    message,
  };

  if (mode === "test") {
    if (!user.email) {
      return NextResponse.json(
        { error: "アカウントにメールアドレスが登録されていません" },
        { status: 400 }
      );
    }
    const ok = await sendDigitalRewardTest({ ...base, to: user.email, nickname: "（お名前）" });
    if (!ok) {
      return NextResponse.json(
        { error: "テストメールを送れませんでした。時間をおいて再度お試しください" },
        { status: 502 }
      );
    }
    return NextResponse.json({ testSentTo: user.email });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const [{ backers, error: backersError }, { data: deliveries, error: deliveriesError }] =
    await Promise.all([loadPaidBackers(supabase, id), loadDeliveries(supabase, id)]);
  if (backersError || !backers) return dbError(backersError);
  if (deliveriesError) return dbError(deliveriesError);

  const { recipients } = collectDigitalRecipients(
    backers,
    (rewards || []) as Reward[],
    reward.id,
    (deliveries || []) as RewardDelivery[]
  );
  const targets = mode === "all" ? recipients : recipients.filter((r) => !r.sentAt);

  if (targets.length === 0) {
    return NextResponse.json(
      { error: mode === "all" ? "送付先の支援者がいません" : "未送付の支援者はいません" },
      { status: 400 }
    );
  }
  if (targets.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `一度に送れるのは${MAX_RECIPIENTS}人までです。運営にお問い合わせください` },
      { status: 400 }
    );
  }

  const { sent, failed } = await sendDigitalRewardEmails(
    targets.map((r) => ({ ...base, to: r.email, nickname: r.name || null })),
    requestId
  );

  const sentSet = new Set(sent);
  const now = new Date().toISOString();
  const rows = targets
    .filter((r) => sentSet.has(r.email))
    .flatMap((r) =>
      r.backerIds.map((backerId) => ({
        project_id: id,
        reward_id: reward.id,
        backer_id: backerId,
        email: r.email,
        sent_at: now,
        sent_by: user.id,
      }))
    );

  let recordFailed = false;
  if (rows.length > 0) {
    const { error } = await service
      .from("reward_deliveries")
      .upsert(rows, { onConflict: "reward_id,backer_id" });
    if (error) {
      // メールは届いているので送信自体は成功として返し、記録できなかったことだけ伝える
      console.error("[digital-delivery] record failed", error);
      recordFailed = true;
    }
  }

  const { data: latest } = await loadDeliveries(supabase, id);

  return NextResponse.json({
    sent: sent.length,
    failed: failed.length,
    recordFailed,
    deliveries: latest || [],
  });
}
