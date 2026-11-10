import * as T from "three";
import { resources } from "./model";
const tiles = [
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
const maps = new Map<string, T.Texture>();
let source: T.Texture | undefined;
let loaded = false;
export const materialsReady = () => !source || loaded;
const listeners = new Set<() => void>();
export function onPaintReady(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
export function paintedMaterial(kind: string, color: string) {
  const index = tiles.indexOf(kind);
  if (index < 0) return undefined;
  if (!source) {
    source = new T.TextureLoader().load("/art/food-materials.png", () => {
      loaded = true;
      for (const t of maps.values()) t.needsUpdate = true;
      listeners.forEach((fn) => fn());
    });
    source.colorSpace = T.SRGBColorSpace;
  }
  let map = maps.get(kind);
  if (!map) {
    map = source.clone();
    map.colorSpace = T.SRGBColorSpace;
    map.repeat.set(1 / 3 - 0.008, 1 / 4 - 0.008);
    map.offset.set(
      (index % 3) / 3 + 0.004,
      (3 - Math.floor(index / 3)) / 4 + 0.004,
    );
    map.anisotropy = 4;
    map.needsUpdate = true;
    maps.set(kind, map);
  }
  const tint = new T.Color(color),
    base = new T.Color(resources.find((r) => r.kind === kind)?.color ?? color);
  tint.setRGB(
    tint.r / Math.max(0.02, base.r),
    tint.g / Math.max(0.02, base.g),
    tint.b / Math.max(0.02, base.b),
  );
  return new T.MeshStandardMaterial({
    map,
    color: tint,
    roughness: ["tomato", "salmon", "scallop"].includes(kind) ? 0.52 : 0.82,
    metalness: 0,
  });
}
