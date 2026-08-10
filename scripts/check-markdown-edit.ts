import {
  insertImage,
  insertLink,
  togglePrefix,
  wrapSelection,
  type TextSelection,
} from "../src/lib/markdown/edit";

let failed = 0;

function check(name: string, got: TextSelection, want: TextSelection) {
  const ok =
    got.value === want.value &&
    got.start === want.start &&
    got.end === want.end;
  if (!ok) {
    failed++;
    console.log(`NG  ${name}`);
    console.log(`    got  ${JSON.stringify(got)}`);
    console.log(`    want ${JSON.stringify(want)}`);
  } else {
    console.log(`ok  ${name}`);
  }
}

/** 選択位置を | で表した文字列から TextSelection を作る */
function sel(marked: string): TextSelection {
  const start = marked.indexOf("|");
  const end = marked.indexOf("|", start + 1) - 1;
  return { value: marked.replace(/\|/g, ""), start, end: end < 0 ? start : end };
}

// --- 太字 ---
check(
  "選択した語を太字で囲む",
  wrapSelection(sel("私は|うれしい|です"), "**", "太字"),
  { value: "私は**うれしい**です", start: 4, end: 8 }
);

check(
  "未選択なら見本を入れて選択状態にする",
  wrapSelection(sel("ここに|"), "**", "太字"),
  { value: "ここに**太字**", start: 5, end: 7 }
);

// --- 見出し・リスト ---
check(
  "カーソル行を見出しにする",
  togglePrefix(sel("一行目\n二行|目\n三行目"), "## "),
  { value: "一行目\n## 二行目\n三行目", start: 4, end: 10 }
);

check(
  "もう一度押すと見出しを外す",
  togglePrefix(sel("## 見出|し"), "## "),
  { value: "見出し", start: 0, end: 3 }
);

check(
  "箇条書きから番号付きへ入れ替える",
  togglePrefix(sel("|- りんご|"), "1. "),
  { value: "1. りんご", start: 0, end: 6 }
);

check(
  "複数行をまとめて箇条書きにする",
  togglePrefix(sel("|りんご\nみかん|"), "- "),
  { value: "- りんご\n- みかん", start: 0, end: 11 }
);

check(
  "空の本文でも印だけ入る",
  togglePrefix(sel("|"), "## "),
  { value: "## ", start: 0, end: 3 }
);

// --- リンク ---
check(
  "選択した語をリンクにし、URL を選択して返す",
  insertLink(sel("詳しくは|こちら|"), "リンクの文字"),
  { value: "詳しくは[こちら](https://)", start: 10, end: 18 }
);

// --- 画像 ---
check(
  "カーソル位置に画像を段落として差し込む",
  insertImage(sel("本文|"), "https://example.com/a.png"),
  {
    value: "本文\n\n![](https://example.com/a.png)\n\n",
    start: 36,
    end: 36,
  }
);

console.log(failed === 0 ? "\nすべて通りました" : `\n${failed}件 失敗`);
process.exit(failed === 0 ? 0 : 1);
