"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import ThemeEditor from "@/components/project/ThemeEditor";
import { ProjectTheme, resolveTheme } from "@/lib/theme/project-theme";
import type { Project } from "@/types";

interface DesignTabProps {
  project: Project;
  onSaved: () => void;
}

export default function DesignTab({ project, onSaved }: DesignTabProps) {
  const [theme, setTheme] = useState<ProjectTheme>(() =>
    resolveTheme(project.theme)
  );
  const [saving, setSaving] = useState(false);

  const saved = useMemo(() => resolveTheme(project.theme), [project.theme]);
  const dirty = useMemo(
    () => JSON.stringify(theme) !== JSON.stringify(saved),
    [theme, saved]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      onSaved();
      toast.success("デザインを保存しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ThemeEditor
        theme={theme}
        onChange={setTheme}
        preview={{
          title: project.title,
          tagline: project.tagline,
          imageUrl: project.main_image_url,
          currentAmount: project.current_amount,
          goalAmount: project.goal_amount,
          backerCount: project.backer_count,
        }}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={!dirty}
          icon={<Save size={16} />}
        >
          デザインを保存
        </Button>
        {dirty && (
          <span className="text-sm text-gray-500">
            保存するまで公開ページは変わりません
          </span>
        )}
      </div>
    </div>
  );
}
