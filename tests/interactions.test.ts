import { test } from "node:test";
import assert from "node:assert/strict";
import { newItem, newProject, isProject } from "../src/model.ts";
import {
  footprintsOverlap,
  layerElevations,
  reorderLayer,
  harmonies,
  hexToHsl,
  hueDistance,
  platePalette,
} from "../src/composition.ts";
import { resizeFromHandle, handles } from "../src/resize.ts";
test("los lados verticales modifican fondo, sin cambiar ancho", () => {
  const i = newItem("stroke", 0, 0);
  const p = resizeFromHandle(i, 20, handles[5], 0, 15);
  assert.equal(p.width, i.width);
  assert.equal(p.depth, 35);
  assert.equal(p.z, 7.5);
  assert.equal(p.z - p.depth / 2, -10);
});
test("las esquinas mantienen proporción y anclaje opuesto", () => {
  const i = newItem("zucchini", 0, 0);
  const p = resizeFromHandle(i, 43, handles[4], 20, 10);
  assert.equal(p.width / p.depth, 1);
  assert.equal(p.x - p.width / 2, -i.width / 2);
  assert.equal(p.z - p.depth / 2, -43 / 2);
});
test("la rotación de un ingrediente se respeta al estirar", () => {
  const i = { ...newItem("stroke", 0, 0), rotation: 90 };
  const p = resizeFromHandle(i, 20, handles[3], 20, 0);
  assert.ok(Math.abs(p.x) < 0.001);
  assert.ok(Math.abs(p.z - 10) < 0.001);
  assert.equal(p.depth, 20);
});
test("apilar refleja el orden, respeta ocultos y no eleva piezas separadas", () => {
  const a = newItem("zucchini", 0, 0),
    b = newItem("carrot", 0, 0),
    c = newItem("broccoli", 120, 100);
  const p = { ...newProject(), items: [a, b, c] };
  const initial = layerElevations(p.items, true);
  assert.ok(initial.get(b.id)! > initial.get(a.id)!);
  assert.equal(initial.get(c.id), 0);
  const changed = reorderLayer(p, a.id, 2),
    later = layerElevations(changed.items, true);
  assert.ok(later.get(a.id)! > later.get(b.id)!);
  assert.equal(layerElevations([{ ...a, hidden: true }, b], true).get(b.id), 0);
  assert.equal(layerElevations(p.items, false).get(b.id), 0);
});
test("la intersección de capas usa orientación y admite fondos independientes", () => {
  const a = { ...newItem("line", 0, 0), width: 100, depth: 3, rotation: 45 };
  const b = { ...newItem("dot", 0, 60), width: 8, depth: 8 };
  assert.equal(footprintsOverlap(a, b), false);
  assert.equal(footprintsOverlap(a, { ...b, x: 0, z: 0 }), true);
});
test("armonías derivadas del tono real y paleta solo de elementos visibles", () => {
  const h = harmonies("#ff0000");
  assert.ok(hueDistance(hexToHsl(h.complementary).h, 180) < 1);
  const analog = h.analogous.map((c) => hexToHsl(c).h);
  assert.ok(hueDistance(analog[0], 330) < 1);
  assert.ok(hueDistance(analog[2], 30) < 1);
  assert.equal(harmonies("#808080").neutral, true);
  assert.equal(
    platePalette([newItem("carrot"), { ...newItem("broccoli"), hidden: true }])
      .length,
    1,
  );
});
test("el formato antiguo sigue admitido y los nuevos fondos inválidos se rechazan", () => {
  const p = newProject(),
    i = newItem("zucchini");
  p.items = [i];
  assert.equal(isProject(p), true);
  assert.equal(isProject({ ...p, items: [{ ...i, depth: -1 }] }), false);
  const legacy = { ...i };
  delete legacy.depth;
  assert.equal(isProject({ ...p, items: [legacy] }), true);
});
