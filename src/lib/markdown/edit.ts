/**
 * 本文エディタのツールバーが行うテキスト変換。
 *
 * カーソル位置の扱いを間違えると入力が壊れるので、DOM から切り離して
 * 単体で確かめられるようにしてある。
 */

export interface TextSelection {
  value: string;
  start: number;
  end: number;
}

/** 行頭に付く印。別の印が付いている行はこれに置き換える */
const LINE_MARK = /^(#{1,4} |[-*] |\d+\. |> )/;

/** 選択範囲を印で囲む。未選択なら見本の語を入れて、それを選択状態にする */
export function wrapSelection(
  { value, start, end }: TextSelection,
  mark: string,
  sample: string
): TextSelection {
  const selected = value.slice(start, end) || sample;
  return {
    value: value.slice(0, start) + mark + selected + mark + value.slice(end),
    start: start + mark.length,
    end: start + mark.length + selected.length,
  };
}

/** 選択している行の頭に印を付ける。すでに付いていれば外す */
export function togglePrefix(
  { value, start, end }: TextSelection,
  mark: string
): TextSelection {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const rawTo = value.indexOf("\n", end);
  const to = rawTo === -1 ? value.length : rawTo;

  const updated = value
    .slice(from, to)
    .split("\n")
    .map((line) =>
      line.startsWith(mark)
        ? line.slice(mark.length)
        : mark + line.replace(LINE_MARK, "")
    )
    .join("\n");

  return {
    value: value.slice(0, from) + updated + value.slice(to),
    start: from,
    end: from + updated.length,
  };
}

/** [文字](URL) を差し込み、URL の部分を選択して返す */
export function insertLink(
  { value, start, end }: TextSelection,
  sample = "リンクの文字",
  url = "https://"
): TextSelection {
  const selected = value.slice(start, end) || sample;
  const snippet = `[${selected}](${url})`;
  // "[" + 文字 + "](" までを飛ばした位置が URL の先頭
  const urlStart = start + selected.length + 3;
  return {
    value: value.slice(0, start) + snippet + value.slice(end),
    start: urlStart,
    end: urlStart + url.length,
  };
}

/** カーソル位置に画像を差し込む。前後を空行で挟んで段落として独立させる */
export function insertImage(
  { value, start }: TextSelection,
  url: string
): TextSelection {
  const snippet = `\n\n![](${url})\n\n`;
  const at = start + snippet.length;
  return {
    value: value.slice(0, start) + snippet + value.slice(start),
    start: at,
    end: at,
  };
}
