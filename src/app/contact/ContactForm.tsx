"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { CONTACT_CATEGORIES } from "@/lib/config/contact-categories";
import { SUPPORT_EMAIL } from "@/lib/config/site";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  /** 送信処理は通ったがメールを出せなかった。直接メールしてもらう */
  | { kind: "undelivered" }
  | { kind: "error"; message: string };

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const sending = status.kind === "sending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          projectUrl,
          message,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          kind: "error",
          message: data.error || "送信に失敗しました。時間をおいてお試しください",
        });
        return;
      }

      setStatus(data.delivered ? { kind: "sent" } : { kind: "undelivered" });
    } catch {
      setStatus({
        kind: "error",
        message: "通信に失敗しました。電波の良い場所で再度お試しください",
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-8 text-center">
        <p className="text-4xl mb-3">📨</p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          お問い合わせを受け付けました
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {"内容を確認のうえ、ご入力いただいたメールアドレス宛にご返信します。"}
        </p>
        <p className="text-xs text-gray-400 mt-3">
          {"数日経っても返信が届かない場合は、迷惑メールフォルダをご確認ください。"}
        </p>
      </div>
    );
  }

  if (status.kind === "undelivered") {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-8 text-center">
        <p className="text-4xl mb-3">🙏</p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          フォームからの送信ができませんでした
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {"お手数ですが、下記のアドレス宛にメールでご連絡ください。入力いただいた内容をそのままお送りいただけます。"}
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-block px-6 py-3 rounded-full text-white font-bold btn-pop"
          style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
        >
          {SUPPORT_EMAIL}
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="お名前"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="山田 太郎"
          fullWidth
        />
        <Input
          label="メールアドレス"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          hint="ご返信先になります"
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-category" className="text-sm font-semibold text-gray-700">
          お問い合わせの種別
        </label>
        <select
          id="contact-category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full py-3 px-4 rounded-2xl border-2 border-caramel-100 bg-white text-gray-800 outline-none transition-all duration-200 hover:border-caramel-200 focus:border-candy-pink"
        >
          <option value="" disabled>
            選択してください
          </option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="対象のプロジェクトURL（任意）"
        maxLength={500}
        value={projectUrl}
        onChange={(e) => setProjectUrl(e.target.value)}
        placeholder="https://caramyell.com/projects/..."
        hint="特定のプロジェクトについてのご連絡は、URLがあるとスムーズです"
        fullWidth
      />

      <Textarea
        label="お問い合わせ内容"
        required
        rows={8}
        maxLength={5000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="できるだけ具体的にご記入ください。支援に関するお問い合わせの場合、確認メールに記載の内容をあわせてお知らせいただけると確認がスムーズです。"
        hint={`${message.length} / 5000文字`}
        fullWidth
      />

      {/* 自動投稿よけ。人には見えないので空のまま送られてくるはず */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-red-500 font-medium">{status.message}</p>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={sending}
          className="w-full sm:w-auto px-10 py-3.5 rounded-full text-white font-bold btn-pop disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #F2807B, #F5A34B)",
            boxShadow: "0 4px 20px rgba(242, 128, 123, 0.4)",
          }}
        >
          {sending ? "送信中..." : "この内容で送信する"}
        </button>
        <p className="text-xs text-gray-400 mt-3">
          {"送信いただいた内容は、お問い合わせへの対応のためにのみ利用します。"}
        </p>
      </div>
    </form>
  );
}
