import { test } from "node:test";
import assert from "node:assert/strict";
import {
  demoProject,
  newItem,
  newProject,
  moveItem,
  isProject,
  fingerprint,
  readProjects,
  writeProjects,
  STORAGE,
} from "../src/model.ts";
test("un proyecto 3D se conserva íntegro al guardar y recuperar", () => {
  const p = demoProject();
  p.items[0] = {
    ...p.items[0],
    rotation: 25,
    elevation: 18,
    opacity: 0.7,
    locked: true,
  };
  p.notes = "Montar al pase. Añadir salsa al final.";
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) || null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
  writeProjects([p], storage);
  assert.deepEqual(readProjects(storage), [p]);
});
test("datos dañados no se interpretan como una galería vacía", () => {
  assert.throws(() => readProjects({ getItem: () => "{broken" }));
  assert.throws(() =>
    readProjects({ getItem: () => JSON.stringify([{ id: "x" }]) }),
  );
});
test("un fallo de cuota se comunica al llamante y no se disimula", () => {
  assert.throws(
    () =>
      writeProjects([newProject()], {
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      }),
    /Quota/,
  );
});
test("editar una instancia no altera su copia ni el historial anterior", () => {
  const a = newItem("zucchini"),
    b = { ...a, id: crypto.randomUUID() };
  const p = { ...newProject(), items: [a, b] };
  const before = fingerprint(p);
  const edited = moveItem(p, a.id, { width: 90, color: "#123456" });
  assert.equal(fingerprint(p), before);
  assert.equal(edited.items[1].width, b.width);
  assert.equal(edited.items[0].width, 90);
});
test("rechaza geometrías inválidas, recursos desconocidos e IDs duplicados", () => {
  const p = demoProject();
  assert.equal(isProject(p), true);
  assert.equal(
    isProject({ ...p, items: [{ ...p.items[0], width: NaN }] }),
    false,
  );
  assert.equal(
    isProject({ ...p, items: [{ ...p.items[0], kind: "unknown" }] }),
    false,
  );
  assert.equal(isProject({ ...p, items: [p.items[0], p.items[0]] }), false);
  assert.equal(
    isProject({ ...p, items: [{ ...p.items[0], opacity: 4 }] }),
    false,
  );
});
test("el estado visual ajeno al proyecto no modifica su huella editable", () => {
  const p = demoProject();
  assert.equal(
    fingerprint(p),
    fingerprint({ ...p, updated: "other", thumbnail: "image" }),
  );
  assert.notEqual(fingerprint(p), fingerprint({ ...p, notes: "Nueva nota" }));
});
