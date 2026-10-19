import type { Metadata } from "next";
import InviteClient from "./InviteClient";

export const metadata: Metadata = {
  title: "事務所への招待",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteClient token={token} />;
}
