"use client";

import { cn } from "@/lib/utils";

interface CaramelDripProps {
  className?: string;
  /** ドリップの色 */
  color?: string;
  /** 上向き（セクション下端に付けて下のセクションに垂らす）or 下向き */
  flip?: boolean;
}

/**
 * カラメルが垂れるようなセクション境界の装飾。
 * デザインカンプ「カラメルドリップ・トランジション」を再現。
 */
export default function CaramelDrip({
  className,
  color = "#E8842C",
  flip = false,
}: CaramelDripProps) {
  return (
    <div
      className={cn("w-full overflow-hidden leading-none", className)}
      style={flip ? { transform: "rotate(180deg)" } : undefined}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="caramel-drip-svg w-full"
        style={{ height: "clamp(32px, 6vw, 90px)" }}
      >
        <path
          fill={color}
          d="M0,0 L1440,0 L1440,28
             C1400,28 1390,62 1360,62 C1330,62 1330,34 1300,34
             C1264,34 1266,80 1232,80 C1200,80 1204,40 1172,40
             C1140,40 1146,58 1112,58 C1080,58 1082,30 1048,30
             C1012,30 1018,72 984,72 C952,72 956,36 922,36
             C890,36 894,52 860,52 C828,52 830,26 796,26
             C760,26 766,66 732,66 C700,66 704,38 670,38
             C638,38 642,56 608,56 C576,56 578,30 544,30
             C508,30 514,76 480,76 C448,76 452,40 418,40
             C386,40 390,54 356,54 C324,54 326,28 292,28
             C256,28 262,64 228,64 C196,64 200,36 166,36
             C134,36 138,50 104,50 C72,50 74,26 40,26
             C20,26 12,28 0,28 Z"
        />
      </svg>
    </div>
  );
}
