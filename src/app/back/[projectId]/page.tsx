import BackingClient from "./BackingClient";

export default async function BackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ reward?: string }>;
}) {
  const { projectId } = await params;
  const { reward } = await searchParams;

  return <BackingClient projectSlug={projectId} selectedRewardId={reward} />;
}
