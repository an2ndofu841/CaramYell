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
    <div className="min-h-screen flex items-center justify-center pt-20 pb-tabbar px-4">
      <Card className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-caramel-50 text-caramel-500 flex items-center justify-center mx-auto mb-4">
          <CalendarX size={26} />
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">
          {t.detail.endedDisabled}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {t.detail.endedNotice}
        </p>
        <Link href={`/projects/${projectSlug}`}>
          <Button fullWidth>{t.detail.endedBackToProject}</Button>
        </Link>
      </Card>
    </div>
  );
}
