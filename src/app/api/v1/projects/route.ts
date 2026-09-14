import { NextRequest } from "next/server";
import { v1Json, v1Options, v1TooMany } from "@/lib/api/v1/http";
import {
  fetchPublicProjectsByRefs,
  parseProjectIds,
} from "@/lib/api/v1/public-projects";
import { serializePartnerProject } from "@/lib/api/v1/serialize-project";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export function OPTIONS() {
  return v1Options();
}

export async function GET(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "v1-projects"), 60, 60_000);
  if (!limit.ok) return v1TooMany(limit.retryAfter);

  const parsed = parseProjectIds(req.nextUrl.searchParams.get("ids"));
  if (parsed.error) {
    return v1Json({ error: parsed.error }, { status: 400 });
  }

  const result = await fetchPublicProjectsByRefs(parsed.ids);
  if (result.error) return result.error;

  return v1Json(
    { projects: result.projects.map(serializePartnerProject) },
    { cache: true }
  );
}
