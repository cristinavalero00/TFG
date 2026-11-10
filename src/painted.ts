import * as T from "three";
import { resources, sauceTiles } from "./model";
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
const sources = new Map<string, { texture: T.Texture; loaded: boolean }>();
export const materialsReady = () =>
  [...sources.values()].every((source) => source.loaded);
const listeners = new Set<() => void>();
export function onPaintReady(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
export function paintedMaterial(kind: string, color: string) {
  const sauce = kind in sauceTiles;
  const index = sauce ? sauceTiles[kind] : tiles.indexOf(kind);
  if (index < 0) return undefined;
  const path = sauce ? "/art/sauce-materials.png" : "/art/food-materials.png";
  let source = sources.get(path);
  if (!source) {
    const state = {
      texture: new T.TextureLoader().load(path, () => {
        state.loaded = true;
        for (const t of maps.values()) t.needsUpdate = true;
        listeners.forEach((fn) => fn());
      }),
      loaded: false,
    };
    state.texture.colorSpace = T.SRGBColorSpace;
    sources.set(path, state);
    source = state;
  }
  const cols = sauce ? 2 : 3,
    rows = sauce ? 2 : 4;
  let map = maps.get(kind);
  if (!map) {
    map = source.texture.clone();
    map.colorSpace = T.SRGBColorSpace;
    map.repeat.set(1 / cols - 0.008, 1 / rows - 0.008);
    map.offset.set(
      (index % cols) / cols + 0.004,
      (rows - 1 - Math.floor(index / cols)) / rows + 0.004,
    );
    map.anisotropy = 4;
    map.needsUpdate = true;
    maps.set(kind, map);
  }
  const tint = new T.Color(color),
    base = new T.Color(resources.find((r) => r.kind === kind)?.color ?? color);
  if (!sauce)
    tint.setRGB(
      tint.r / Math.max(0.02, base.r),
      tint.g / Math.max(0.02, base.g),
      tint.b / Math.max(0.02, base.b),
    );
  return new T.MeshStandardMaterial({
    map,
    color: tint,
    roughness: sauce
      ? 0.65
      : ["tomato", "salmon", "scallop"].includes(kind)
        ? 0.52
        : 0.82,
    metalness: 0,
  });
}
