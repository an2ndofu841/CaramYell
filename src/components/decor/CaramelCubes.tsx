import { cn } from "@/lib/utils";

/**
 * ヒーローの挿絵。積み重ねたキャラメルの粒に、上からソースがとろりと
 * かかっている。エール（応援）の意味を込めて、小さな星のきらめきを添える。
 * 装飾なので読み上げからは外す。
 */
export default function CaramelCubes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 300" className={cn("block", className)} aria-hidden>
      <defs>
        <linearGradient id="cy-cube-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6C48A" />
          <stop offset="1" stopColor="#E9A158" />
        </linearGradient>
        <linearGradient id="cy-cube-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9853A" />
          <stop offset="1" stopColor="#B4642A" />
        </linearGradient>
        <linearGradient id="cy-cube-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B96626" />
          <stop offset="1" stopColor="#8E4C1C" />
        </linearGradient>
        <linearGradient id="cy-sauce" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C46E2B" />
          <stop offset="1" stopColor="#8E4C1C" />
        </linearGradient>
        <filter id="cy-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* 床に落ちる柔らかい影 */}
      <ellipse cx="160" cy="268" rx="118" ry="16" fill="#A85D22" opacity="0.18" filter="url(#cy-soft)" />

      {/* 下段・左の粒 */}
      <Cube x={58} y={168} s={92} />
      {/* 下段・右の粒 */}
      <Cube x={168} y={176} s={84} />
      {/* 上段の粒（ソースがかかっている） */}
      <Cube x={110} y={88} s={96} />

      {/* 上段の粒にかかったソース。上面を覆い、側面へしずくが垂れる */}
      <path
        fill="url(#cy-sauce)"
        d="M110 112 L158 88 L206 112 L158 136 Z
           M110 112 L158 136 L158 168 C158 176 150 176 150 168 L150 150
           C150 144 142 144 142 152 L142 158 C142 166 134 166 134 158 L134 140
           L110 128 Z
           M158 136 L206 112 L206 132 C206 140 198 140 198 132 L198 130
           C198 136 190 138 190 146 L190 180 C190 190 180 190 180 180 L180 146
           C180 140 172 140 172 146 L172 150 C172 156 166 156 166 150 L166 132 Z"
      />
      {/* ソースの艶 */}
      <path
        d="M128 108 L156 94"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M184 150 L184 172" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />

      {/* エールのきらめき */}
      <Sparkle x={254} y={70} r={13} />
      <Sparkle x={66} y={92} r={9} />
      <Sparkle x={236} y={128} r={6} />
    </svg>
  );
}

/** 等角に描いたキャラメルの粒。(x, y) は上面の左端、s は幅 */
function Cube({ x, y, s }: { x: number; y: number; s: number }) {
  const h = s / 2;
  const top = `M${x} ${y + h / 2} L${x + h} ${y} L${x + s} ${y + h / 2} L${x + h} ${y + h} Z`;
  const left = `M${x} ${y + h / 2} L${x + h} ${y + h} L${x + h} ${y + h + h * 0.85} L${x} ${y + h / 2 + h * 0.85} Z`;
  const right = `M${x + h} ${y + h} L${x + s} ${y + h / 2} L${x + s} ${y + h / 2 + h * 0.85} L${x + h} ${y + h + h * 0.85} Z`;
  return (
    <g strokeLinejoin="round">
      <path d={left} fill="url(#cy-cube-left)" />
      <path d={right} fill="url(#cy-cube-right)" />
      <path d={top} fill="url(#cy-cube-top)" />
      {/* 上面の照り返し */}
      <path
        d={`M${x + s * 0.22} ${y + h / 2} L${x + h} ${y + h * 0.2}`}
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  const k = r * 0.28;
  return (
    <path
      fill="#E39549"
      d={`M${x} ${y - r} C${x + k * 0.4} ${y - k} ${x + k} ${y - k * 0.4} ${x + r} ${y}
          C${x + k} ${y + k * 0.4} ${x + k * 0.4} ${y + k} ${x} ${y + r}
          C${x - k * 0.4} ${y + k} ${x - k} ${y + k * 0.4} ${x - r} ${y}
          C${x - k} ${y - k * 0.4} ${x - k * 0.4} ${y - k} ${x} ${y - r} Z`}
    />
  );
}
