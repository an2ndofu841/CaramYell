export default function SchedulePreviewNotice() {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16 px-4">
      <div className="max-w-xl mx-auto rounded-xl border border-line bg-white p-6 sm:p-8">
        <p className="text-xs font-bold text-ink-muted">テスト送信</p>
        <h1 className="mt-1 text-lg font-bold text-ink">ここに日程の選択画面が開きます</h1>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          テスト送信のメールのリンクはプレビュー用です。実際の案内メールでは、支援者ごとの専用リンクからこの画面で日程を選べます。
        </p>
      </div>
    </div>
  );
}
