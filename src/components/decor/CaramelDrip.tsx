import { cn } from "@/lib/utils";

/**
 * キャラメルソースが垂れるセクション境界。
 *
 * 1枚の横長 SVG を引き伸ばすと、スマホ幅でしずくが細く潰れてしまう。
 * そこで 360px 幅のタイルを背景として横に繰り返し、どの画面幅でも
 * しずくの丸みを保つ。上のセクションと同じ色を渡すと、その面から
 * ソースが垂れているように見える。
 */

// しずく（左端 x, 右端 x, 垂れる深さ y）。長さと太さを不揃いにして手作りの感じを出す
const DRIPS: [number, number, number][] = [
  [34, 52, 44],
  [112, 124, 30],
  [186, 212, 56],
  [268, 280, 34],
  [318, 332, 42],
];
const BAND = 14;
const SHOULDER = 8;

function dripPath() {
  let d = `M0,0 L0,${BAND}`;
  for (const [l, r, depth] of DRIPS) {
    const rad = (r - l) / 2;
    d +=
      ` L${l - SHOULDER},${BAND}` +
      ` C${l - 2},${BAND} ${l},${BAND + 2} ${l},${BAND + 8}` +
      ` L${l},${depth - rad}` +
      ` A${rad},${rad} 0 0 0 ${r},${depth - rad}` +
      ` L${r},${BAND + 8}` +
      ` C${r},${BAND + 2} ${r + 2},${BAND} ${r + SHOULDER},${BAND}`;
  }
  return d + ` L360,${BAND} L360,0 Z`;
}

const PATH = dripPath();

function tile(color: string) {
  // しずくの左上に小さな照り返しを入れて、ソースの艶を出す
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 64" width="360" height="64">` +
    `<path fill="${color}" d="${PATH}"/>` +
    DRIPS.map(
      ([l, r, depth]) =>
        `<rect x="${l + 3}" y="${BAND + 4}" width="2.5" height="${Math.max(depth - BAND - 16, 4)}" rx="1.25" fill="#fff" opacity="0.22"/>`
    ).join("") +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function CaramelDrip({
  color = "#86471A",
  className,
}: {
  /** 上のセクションと同じ色 */
  color?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none h-10 sm:h-14", className)}
      style={{
        backgroundImage: tile(color),
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
        backgroundPosition: "center top",
      }}
    />
  );
}
