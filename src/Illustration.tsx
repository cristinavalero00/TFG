import { useId } from "react";
export function Food({
  kind,
  color,
  size = 64,
}: {
  kind: string;
  color?: string;
  size?: number;
}) {
  const id = useId().replace(/:/g, "");
  const paintedKinds = [
    "zucchini",
    "carrot",
    "broccoli",
    "sprout",
    "tomato",
    "asparagus",
    "salmon",
    "protein",
    "scallop",
    "mushroom",
    "quenelle",
    "flower",
  ];
  const tile = paintedKinds.indexOf(kind);
  const shapes: Record<string, string> = {
    zucchini: "M50 11A39 39 0 1 1 49.9 11Z",
    carrot:
      "M16 42Q9 28 23 25L76 25Q91 28 86 44L81 63Q78 72 67 72L24 72Q10 71 13 57Z",
    broccoli:
      "M36 80L40 65Q16 67 14 51Q12 36 28 34Q25 16 43 15Q58 8 66 25Q85 20 88 41Q97 60 72 66L59 66L64 82Z",
    sprout:
      "M45 87L49 49Q20 65 13 38Q40 25 48 48L46 22Q69 8 80 22Q76 41 51 44L52 60Q76 40 89 57Q86 78 55 69L53 88Z",
    tomato: "M50 13Q83 11 89 43Q97 83 60 89Q18 95 12 61Q6 22 50 13Z",
    asparagus:
      "M12 25L78 25L91 31L78 38L12 38Z M12 45L78 45L91 51L78 58L12 58Z M12 65L78 65L91 71L78 78L12 78Z",
    salmon: "M17 28Q30 15 62 18L85 27L88 64Q84 80 64 83L19 75Q10 57 17 28Z",
    protein: "M15 32Q28 12 60 18Q89 20 89 52Q93 82 63 86L29 80Q5 68 15 32Z",
    scallop: "M50 13Q84 10 88 44Q94 77 62 88Q27 94 14 65Q5 30 32 17Z",
    mushroom:
      "M40 84L42 55Q12 62 12 47Q18 11 53 14Q85 14 89 48Q86 60 59 55L63 84Z",
    quenelle: "M10 62Q21 26 68 25Q94 25 89 45Q73 77 34 79Q12 79 10 62Z",
    flower:
      "M50 41Q24 0 20 27Q-1 45 37 50Q-1 69 27 81Q44 98 50 61Q70 99 82 72Q99 52 62 50Q102 25 72 18Q57 1 50 41Z",
  };
  if (tile >= 0)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="food-illustration painted-food"
      >
        <defs>
          <clipPath id={id}>
            <path d={shapes[kind]} />
          </clipPath>
        </defs>
        <g transform={kind === "carrot" ? "rotate(-20 50 50)" : undefined}>
          <path d={shapes[kind]} fill="#f0e3c8" />
          <image
            href="/art/food-materials.png"
            x={10 - (tile % 3) * 80}
            y={10 - Math.floor(tile / 3) * 80}
            width="240"
            height="320"
            preserveAspectRatio="none"
            clipPath={`url(#${id})`}
          />
          <path
            d={shapes[kind]}
            fill="none"
            stroke="#645139"
            strokeOpacity=".18"
            strokeWidth=".65"
          />
        </g>
        {kind === "tomato" && (
          <path
            d="m50 11 4 10 13-3-7 10 6 8-15-6-13 7 5-12-12-4 14-2Z"
            fill="#526a38"
          />
        )}
      </svg>
    );
  const c = color || "#668943";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="food-illustration"
    >
      {kind === "zucchini" ? (
        <>
          <circle cx="50" cy="50" r="35" fill={c} />
          <circle cx="50" cy="50" r="29" fill="#cadb8e" />
          <circle cx="50" cy="50" r="24" fill="#edf0bf" />
          {[
            [44, 43],
            [56, 43],
            [50, 57],
          ].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.5" ry="4" fill="#abc371" />
          ))}
        </>
      ) : kind === "carrot" ? (
        <g transform="rotate(-25 50 50)">
          <rect
            x="12"
            y="32"
            width="76"
            height="35"
            rx="16"
            fill={color || "#ed942f"}
          />
          {[30, 45, 60, 75].map((x) => (
            <path key={x} d={`M${x} 34v16`} stroke="#f9c57a" strokeWidth="2" />
          ))}
        </g>
      ) : kind === "broccoli" ? (
        <>
          <path d="M44 45h12l5 37H42z" fill="#9ca960" />
          {[
            [33, 45, 17],
            [65, 43, 17],
            [50, 31, 20],
            [48, 49, 21],
          ].map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={i % 2 ? color || "#4c773e" : "#608a48"}
            />
          ))}
          {[
            [30, 41],
            [52, 28],
            [64, 45],
            [46, 52],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="#9bb76c" />
          ))}
        </>
      ) : kind === "sprout" ? (
        <g
          stroke={color || "#71924f"}
          strokeWidth="4"
          fill={color || "#71924f"}
        >
          {[30, 50, 70].map((x, i) => (
            <g key={x}>
              <path d={`M50 80Q${x} 50 ${x} 25`} />
              <ellipse
                cx={x - 7}
                cy={35 + i * 8}
                rx="10"
                ry="6"
                transform={`rotate(25 ${x - 7} 35)`}
              />
              <ellipse cx={x + 6} cy={24 + i * 7} rx="8" ry="6" />
            </g>
          ))}
        </g>
      ) : kind === "asparagus" ? (
        <g fill={color || "#658b42"}>
          {[32, 50, 68].map((y) => (
            <g key={y}>
              <rect x="15" y={y - 3} width="60" height="6" rx="3" />
              <path d={`M73 ${y - 6}L89 ${y}L73 ${y + 6}Z`} fill="#4f7437" />
            </g>
          ))}
        </g>
      ) : kind === "tomato" ? (
        <>
          <circle cx="50" cy="52" r="30" fill={color || "#bd4226"} />
          <path
            d="m50 17 5 13 15-2-10 10 5 12-15-7-14 6 5-13-11-9 15 1z"
            fill="#638143"
          />
        </>
      ) : kind === "salmon" ? (
        <g transform="rotate(-15 50 50)">
          <rect
            x="13"
            y="28"
            width="74"
            height="44"
            rx="12"
            fill={color || "#e99a7d"}
          />
          {[27, 44, 61, 78].map((x) => (
            <path
              key={x}
              d={`M${x} 30q-15 17 0 40`}
              stroke="#ffe0bf"
              fill="none"
              strokeWidth="3"
            />
          ))}
        </g>
      ) : kind === "protein" || kind === "scallop" ? (
        <>
          <ellipse cx="50" cy="53" rx="35" ry="28" fill={color || "#9c6143"} />
          <ellipse
            cx="50"
            cy="48"
            rx="29"
            ry="21"
            fill={kind === "scallop" ? "#f2ddb1" : "#b67c53"}
          />
          {[35, 48, 61].map((x) => (
            <path
              key={x}
              d={`M${x} 35v26`}
              stroke="#805332"
              opacity=".5"
              strokeWidth="3"
            />
          ))}
        </>
      ) : kind === "mushroom" ? (
        <>
          <rect x="42" y="45" width="17" height="37" rx="6" fill="#e7d6b8" />
          <path d="M16 50a34 34 0 0 1 68 0z" fill={color || "#aa8668"} />
          <ellipse cx="50" cy="50" rx="34" ry="6" fill="#72543f" />
        </>
      ) : kind === "flower" ? (
        <>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="30"
              rx="10"
              ry="17"
              fill={color || "#a57fa3"}
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="9" fill="#e2ba50" />
        </>
      ) : kind === "quenelle" ? (
        <ellipse
          cx="50"
          cy="50"
          rx="38"
          ry="19"
          transform="rotate(-22 50 50)"
          fill={color || "#ddc480"}
        />
      ) : ["dot", "circle"].includes(kind) ? (
        <circle
          cx="50"
          cy="50"
          r={kind === "dot" ? 17 : 32}
          fill={color || "#b65536"}
        />
      ) : (
        <ellipse
          cx="50"
          cy="52"
          rx="39"
          ry={kind === "line" ? 4 : kind === "base" ? 26 : 11}
          fill={color || "#b65536"}
        />
      )}
    </svg>
  );
}
export function PlateArt({
  shape = "round",
  filled = false,
}: {
  shape?: string;
  filled?: boolean;
}) {
  return (
    <svg viewBox="0 0 260 210" aria-hidden="true" className="plate-art">
      <ellipse cx="133" cy="113" rx="89" ry="84" fill="#30321d" opacity=".06" />
      {shape === "rectangle" || shape === "slate" ? (
        <>
          <rect
            x="28"
            y="32"
            width="204"
            height="145"
            rx="12"
            fill={shape === "slate" ? "#40413a" : "#fffcf6"}
            stroke="#d8d0c0"
          />
          {shape === "rectangle" && (
            <rect
              x="39"
              y="43"
              width="182"
              height="123"
              rx="10"
              fill="none"
              stroke="#ded7c8"
            />
          )}
        </>
      ) : (
        <>
          <circle
            cx="130"
            cy="104"
            r="84"
            fill="#fffcf6"
            stroke="#d8d0c0"
            strokeWidth="2"
          />
          <circle
            cx="130"
            cy="104"
            r={shape === "bowl" ? 62 : 68}
            fill={shape === "bowl" ? "#f2ede2" : "none"}
            stroke="#d8d0c0"
          />
        </>
      )}
      {filled && (
        <>
          <ellipse cx="124" cy="135" rx="40" ry="10" fill="#b85f43" />
          <circle cx="154" cy="117" r="17" fill="#71924f" />
          <circle cx="154" cy="117" r="12" fill="#dfe8ac" />
          <rect
            x="84"
            y="74"
            width="40"
            height="15"
            rx="7"
            fill="#e79535"
            transform="rotate(-25 104 81)"
          />
          <circle cx="152" cy="72" r="13" fill="#507c3f" />
        </>
      )}
    </svg>
  );
}
