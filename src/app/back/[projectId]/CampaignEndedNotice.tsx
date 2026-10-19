"use client";

import Link from "next/link";
import { CalendarX } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useT } from "@/components/i18n/LocaleProvider";

export default function CampaignEndedNotice({
  projectSlug,
}: {
  projectSlug: string;
}) {
  const t = useT();

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center pt-24 pb-tabbar px-4">
      <Card className="max-w-md w-full text-center">
        <CalendarX size={24} strokeWidth={1.75} className="mx-auto mb-4 text-ink-muted" />
        <h1
          className="text-lg font-bold text-ink mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.detail.endedDisabled}
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          {t.detail.endedNotice}
        </p>
        <Link href={`/projects/${projectSlug}`}>
          <Button fullWidth>{t.detail.endedBackToProject}</Button>
        </Link>
      </Card>
    </div>
  );
}
