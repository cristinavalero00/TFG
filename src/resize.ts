import * as T from "three";
import type { Item } from "./model";
export type Handle = { x: number; z: number; name: string };
export const handles: Handle[] = [
  { x: -1, z: -1, name: "superior izquierda" },
  { x: 0, z: -1, name: "superior" },
  { x: 1, z: -1, name: "superior derecha" },
  { x: 1, z: 0, name: "derecha" },
  { x: 1, z: 1, name: "inferior derecha" },
  { x: 0, z: 1, name: "inferior" },
  { x: -1, z: 1, name: "inferior izquierda" },
  { x: -1, z: 0, name: "izquierda" },
];
export function resizeFromHandle(
  i: Item,
  depth: number,
  handle: Handle,
  dx: number,
  dz: number,
  free = false,
) {
  let width = Math.max(2, Math.min(300, i.width + handle.x * dx)),
    nextDepth = Math.max(2, Math.min(300, depth + handle.z * dz));
  if (handle.x && handle.z && !free) {
    const rx = (handle.x * dx) / i.width,
      rz = (handle.z * dz) / depth;
    let ratio = 1 + (Math.abs(rx) > Math.abs(rz) ? rx : rz);
    ratio = Math.max(
      Math.max(2 / i.width, 2 / depth),
      Math.min(Math.min(300 / i.width, 300 / depth), ratio),
    );
    width = i.width * ratio;
    nextDepth = depth * ratio;
  }
  const x = (handle.x * (width - i.width)) / 2,
    z = (handle.z * (nextDepth - depth)) / 2,
    a = (-i.rotation * Math.PI) / 180;
  return {
    width,
    depth: nextDepth,
    x: i.x + x * Math.cos(a) + z * Math.sin(a),
    z: i.z - x * Math.sin(a) + z * Math.cos(a),
  };
}
export function createResizeOverlay({
  host,
  canvas,
  camera,
  getItem,
  getObject,
  isEnabled,
  onCommit,
  render,
  setOrbit,
}: {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  camera: T.Camera;
  getItem: () => Item | undefined;
  getObject: () => T.Object3D | undefined;
  isEnabled: () => boolean;
  onCommit: (id: string, patch: Partial<Item>) => void;
  render: () => void;
  setOrbit: (enabled: boolean) => void;
}) {
  const root = document.createElement("div");
  root.className = "resize-overlay";
  host.append(root);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const outline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon",
  );
  outline.setAttribute("fill", "none");
  outline.setAttribute("stroke", "#b8431f");
  outline.setAttribute("stroke-width", "1.3");
  svg.append(outline);
  root.append(svg);
  type Gesture = {
    item: Item;
    depth: number;
    object: T.Object3D;
    handle: Handle;
    start: T.Vector3;
    scale: T.Vector3;
    patch: ReturnType<typeof resizeFromHandle> | null;
  };
  let gesture: Gesture | null = null;
  const ray = new T.Raycaster(),
    mouse = new T.Vector2();
  const world = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(mouse, camera);
    return ray.ray.intersectPlane(
      new T.Plane(new T.Vector3(0, 1, 0), -6),
      new T.Vector3(),
    );
  };
  const restore = () => {
    if (!gesture) return;
    const g = gesture;
    g.object.scale.copy(g.scale);
    g.object.position.x = g.item.x;
    g.object.position.z = g.item.z;
    g.object.userData.localWidth = g.item.width;
    g.object.userData.localDepth = g.depth;
    gesture = null;
    setOrbit(true);
    render();
  };
  const buttons = handles.map((handle) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "resize-handle";
    b.dataset.handle = handle.name;
    b.setAttribute("aria-label", "Redimensionar " + handle.name);
    b.title =
      handle.x && handle.z
        ? "Escalar proporcionalmente. Mayús: proporciones libres."
        : "Estirar este lado";
    b.tabIndex = -1;
    b.style.cursor =
      handle.x === 0
        ? "ns-resize"
        : handle.z === 0
          ? "ew-resize"
          : handle.x === handle.z
            ? "nwse-resize"
            : "nesw-resize";
    root.append(b);
    b.addEventListener("pointerdown", (e) => {
      const i = getItem(),
        object = getObject(),
        start = world(e);
      if (!i || !object || !start || !isEnabled()) return;
      e.preventDefault();
      e.stopPropagation();
      b.setPointerCapture(e.pointerId);
      setOrbit(false);
      gesture = {
        item: structuredClone(i),
        depth: object.userData.localDepth,
        object,
        handle,
        start,
        scale: object.scale.clone(),
        patch: null,
      };
      root.classList.add("resizing");
    });
    b.addEventListener("pointermove", (e) => {
      if (!gesture) return;
      e.preventDefault();
      const pos = world(e);
      if (!pos) return;
      const g = gesture,
        delta = pos
          .sub(g.start)
          .applyAxisAngle(new T.Vector3(0, 1, 0), -g.object.rotation.y);
      const patch = resizeFromHandle(
        g.item,
        g.depth,
        g.handle,
        delta.x,
        delta.z,
        e.shiftKey,
      );
      g.patch = patch;
      g.object.position.x = patch.x;
      g.object.position.z = patch.z;
      g.object.scale.x = (g.scale.x * patch.width) / g.item.width;
      g.object.scale.z = (g.scale.z * patch.depth) / g.depth;
      g.object.userData.localWidth = patch.width;
      g.object.userData.localDepth = patch.depth;
      render();
    });
    b.addEventListener("pointerup", (e) => {
      if (!gesture) return;
      e.preventDefault();
      e.stopPropagation();
      const { item, patch } = gesture;
      gesture = null;
      root.classList.remove("resizing");
      setOrbit(true);
      if (patch) onCommit(item.id, patch);
      render();
    });
    b.addEventListener("pointercancel", () => {
      restore();
      root.classList.remove("resizing");
    });
    return b;
  });
  const key = (e: KeyboardEvent) => {
    if (e.key === "Escape" && gesture) {
      e.preventDefault();
      e.stopImmediatePropagation();
      restore();
      root.classList.remove("resizing");
    }
  };
  window.addEventListener("keydown", key, true);
  return {
    update() {
      const i = getItem(),
        o = getObject();
      if (!i || !o || !isEnabled()) {
        root.hidden = true;
        return;
      }
      root.hidden = false;
      const rect = canvas.getBoundingClientRect();
      const w = o.userData.localWidth,
        d = o.userData.localDepth,
        a = o.rotation.y;
      const project = (x: number, z: number) => {
        const v = new T.Vector3(
          o.position.x +
            ((x * w) / 2) * Math.cos(a) +
            ((z * d) / 2) * Math.sin(a),
          o.position.y + i.thickness + 0.5,
          o.position.z -
            ((x * w) / 2) * Math.sin(a) +
            ((z * d) / 2) * Math.cos(a),
        ).project(camera);
        return {
          x: ((v.x + 1) * rect.width) / 2,
          y: ((1 - v.y) * rect.height) / 2,
        };
      };
      outline.setAttribute(
        "points",
        [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ]
          .map(([x, z]) => {
            const p = project(x, z);
            return `${p.x},${p.y}`;
          })
          .join(" "),
      );
      buttons.forEach((b, n) => {
        const p = project(handles[n].x, handles[n].z);
        b.style.left = p.x + "px";
        b.style.top = p.y + "px";
        const center = project(0, 0);
        const angle =
          ((((Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI) %
            180) +
            180) %
          180;
        b.style.cursor = [
          "ew-resize",
          "nwse-resize",
          "ns-resize",
          "nesw-resize",
        ][Math.round(angle / 45) % 4];
      });
    },
    destroy() {
      window.removeEventListener("keydown", key, true);
      root.remove();
    },
  };
}
