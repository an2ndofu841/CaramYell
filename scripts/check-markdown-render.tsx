import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "../src/components/ui/Markdown";

/**
 * 掲載者の本文からスクリプトが混入しないことを確かめる。
 * react-markdown は生 HTML を描画しない設定だが、思い込みで済ませずに出力を見る。
 */
const hostile = [
  `<script>alert('XSSMARKER1')</script>`,
  `<img src=x onerror="alert('XSSMARKER2')">`,
  `[クリック](javascript:alert('XSSMARKER3'))`,
  `![画像](javascript:alert('XSSMARKER4'))`,
  `<a href="javascript:alert('XSSMARKER5')">raw link</a>`,
  `[dataリンク](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`,
  `<iframe src="https://evil.example.com"></iframe>`,
  `[ok](https://example.com) と ![ok](https://example.com/a.png)`,
].join("\n\n");

const html = renderToStaticMarkup(<Markdown>{hostile}</Markdown>);

console.log("---- 出力 ----");
console.log(html);
console.log("---- 判定 ----");

// エスケープされた本文の中に "javascript:" という文字列が残るのは問題ない
// （読者にはただの文字として見えるだけ）。属性として成立しているかを見る。
const forbidden: [string, RegExp][] = [
  ["script タグ", /<script/i],
  ["iframe タグ", /<iframe/i],
  ["onXXX 属性", / on[a-z]+=["']/i],
  ["javascript: に飛ぶ属性", /(href|src)=["']\s*javascript:/i],
  ["data:text/html に飛ぶ属性", /(href|src)=["']\s*data:text\/html/i],
];

let failed = 0;
for (const [label, pattern] of forbidden) {
  if (pattern.test(html)) {
    failed++;
    console.log(`NG  ${label} が出力に残っている`);
  } else {
    console.log(`ok  ${label} は出力されない`);
  }
}

// 正当なリンクと画像はちゃんと出ること
for (const [label, pattern] of [
  ["通常のリンク", /href="https:\/\/example\.com"/],
  ["通常の画像", /src="https:\/\/example\.com\/a\.png"/],
] as [string, RegExp][]) {
  if (pattern.test(html)) {
    console.log(`ok  ${label} は表示される`);
  } else {
    failed++;
    console.log(`NG  ${label} が消えている`);
  }
}

console.log(failed === 0 ? "\nすべて通りました" : `\n${failed}件 失敗`);
process.exit(failed === 0 ? 0 : 1);
