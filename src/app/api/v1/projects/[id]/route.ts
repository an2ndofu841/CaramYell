import { NextRequest } from "next/server";
import { v1Json, v1Options, v1TooMany } from "@/lib/api/v1/http";
import {
  fetchPublicProject,
  isProjectRef,
} from "@/lib/api/v1/public-projects";
import { serializePartnerProject } from "@/lib/api/v1/serialize-project";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export function OPTIONS() {
  return v1Options();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(clientKey(req, "v1-projects"), 60, 60_000);
  if (!limit.ok) return v1TooMany(limit.retryAfter);

  const { id } = await params;
  const ref = id?.trim() ?? "";
  if (!ref || !isProjectRef(ref)) {
    return v1Json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  const result = await fetchPublicProject(ref);
  if (result.error) return result.error;
  if (!result.project) {
    return v1Json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  return v1Json(
    { project: serializePartnerProject(result.project) },
    { cache: true }
  );
}
