import type { Item, Project } from "./model";
/** Depth/width defaults for resources. Old files without depth keep loading. */
const ASPECT: Record<string, number> = {
  zucchini: 1,
  carrot: 0.44,
  broccoli: 0.94,
  sprout: 0.65,
  tomato: 1,
  asparagus: 0.34,
  salmon: 0.625,
  protein: 0.625,
  scallop: 1,
  mushroom: 0.89,
  quenelle: 0.5,
  flower: 1,
  dot: 1,
  stroke: 0.276,
  base: 0.76,
  line: 0.057,
  circle: 1,
};
export const itemDepth = (i: Pick<Item, "kind" | "width" | "depth">) =>
  i.depth ?? Math.max(2, i.width * (ASPECT[i.kind] ?? 1));
export function reorderLayer(p: Project, id: string, target: number): Project {
  const from = p.items.findIndex((i) => i.id === id);
  if (from < 0) return p;
  const items = [...p.items],
    [item] = items.splice(from, 1);
  items.splice(Math.max(0, Math.min(target, items.length)), 0, item);
  return { ...p, items, layerStacking: true };
}
function polygon(i: Item) {
  const a = (-i.rotation * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, z]) => ({
    x: i.x + ((x * i.width) / 2) * c + ((z * itemDepth(i)) / 2) * s,
    z: i.z - ((x * i.width) / 2) * s + ((z * itemDepth(i)) / 2) * c,
  }));
}
export function footprintsOverlap(a: Item, b: Item) {
  const A = polygon(a),
    B = polygon(b);
  for (const P of [A, B])
    for (let i = 0; i < 4; i++) {
      const u = P[i],
        v = P[(i + 1) % 4],
        axis = { x: -(v.z - u.z), z: v.x - u.x };
      const project = (p: { x: number; z: number }) =>
        p.x * axis.x + p.z * axis.z;
      const aa = A.map(project),
        bb = B.map(project);
      if (
        Math.max(...aa) <= Math.min(...bb) + 0.01 ||
        Math.max(...bb) <= Math.min(...aa) + 0.01
      )
        return false;
    }
  return true;
}
/** Bottom to top; real elevation is derived, saved manual elevation is retained. */
export function layerElevations(items: Item[], enabled: boolean) {
  const heights = new Map<string, number>();
  for (let n = 0; n < items.length; n++) {
    const item = items[n];
    let support = 0;
    if (enabled && !item.hidden)
      for (let j = 0; j < n; j++) {
        const below = items[j];
        if (!below.hidden && footprintsOverlap(item, below))
          support = Math.max(
            support,
            (heights.get(below.id) ?? below.elevation) + below.thickness + 0.3,
          );
      }
    heights.set(item.id, support + item.elevation);
  }
  return heights;
}
export function hexToHsl(hex: string) {
  const rgb = [1, 3, 5].map((n) => parseInt(hex.slice(n, n + 2), 16) / 255);
  const [r, g, b] = rgb,
    max = Math.max(...rgb),
    min = Math.min(...rgb),
    d = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (d) {
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}
export function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2;
  const rgb =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export const hueDistance = (a: number, b: number) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
export function harmonies(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  const saturation = Math.min(0.85, Math.max(0.35, s)),
    light = Math.min(0.7, Math.max(0.3, l));
  return {
    neutral: s < 0.12,
    analogous: [-30, 0, 30].map((delta) =>
      hslToHex(h + delta, saturation, light),
    ),
    complementary: hslToHex(h + 180, saturation, light),
  };
}
export function platePalette(items: Item[]) {
  const groups = new Map<
    string,
    { color: string; names: string[]; area: number }
  >();
  for (const i of items.filter((i) => !i.hidden)) {
    const key = i.color.toLowerCase(),
      entry = groups.get(key) ?? { color: key, names: [], area: 0 };
    entry.names.push(i.name);
    entry.area += i.width * itemDepth(i) * i.opacity;
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => b.area - a.area);
}
