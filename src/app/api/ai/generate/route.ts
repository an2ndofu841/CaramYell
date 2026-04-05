import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompts: Record<string, string> = {
  tagline: `あなたはクラウドファンディングのプロのコピーライターです。
プロジェクトのタイトルとカテゴリーを受け取り、
魅力的で短いタグライン（1〜2文、50文字以内）を日本語で生成してください。
感情に訴えかけ、プロジェクトの独自性を伝えてください。`,

  description: `あなたはクラウドファンディングのプロのライターです。
プロジェクトのタイトルとカテゴリーを受け取り、
支援者が共感できる魅力的なプロジェクト概要（400〜600文字）を日本語で生成してください。
- 何を作りたいのか
- なぜそれをしたいのか  
- 誰に届けたいのか
- 支援者にどんな価値があるのか
を含めてください。`,

  story: `あなたはクラウドファンディングのプロのストーリーテラーです。
プロジェクトの情報を受け取り、
クリエイターの想いが伝わる感動的なストーリー（300〜500文字）を日本語で生成してください。
- このプロジェクトを始めたきっかけ
- 制作者の情熱や夢
- 支援者へのメッセージ
を含めてください。`,

  reward_description: `あなたはクラウドファンディングのリターン設計の専門家です。
リターンのタイトルを受け取り、
支援者が欲しくなるような魅力的な説明文（100〜200文字）を日本語で生成してください。`,

  translate: `あなたはプロの翻訳者です。
日本語のテキストを英語に翻訳してください。
クラウドファンディングのプロジェクトページとして自然な英語にしてください。`,
};

export async function POST(req: NextRequest) {
  try {
    const { type, input, context, targetLanguage } = await req.json();

    if (!input || !type) {
      return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
    }

    const systemPrompt = systemPrompts[type] || systemPrompts.description;

    const userMessage =
      type === "translate"
        ? `以下の日本語を${targetLanguage || "英語"}に翻訳してください:\n\n${input}`
        : `プロジェクト名: ${input}\nカテゴリー: ${context || "その他"}\n\n上記のプロジェクトに最適な内容を生成してください。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const result = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      result,
      tokens_used: completion.usage?.total_tokens,
    });
  } catch (error: unknown) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "AI生成に失敗しました" },
      { status: 500 }
    );
  }
}
