import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Item, Project } from "./model";
export type SceneAPI = {
  capture: (view: "top" | "current", includeGuides: boolean) => string;
  zoom: (delta: number) => void;
  reset: () => void;
  fit: () => void;
  angles: (az: number, inc: number) => void;
};
type Props = {
  project: Project;
  selected: string | null;
  guide: string;
  view: "top" | "perspective";
  tool: "move" | "rotate" | "scale";
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Item>) => void;
  onAdd: (kind: string, x: number, z: number) => void;
  onCamera: (zoom: number, az: number, inc: number) => void;
};
function material(color: string, roughness = 0.82) {
  return new T.MeshStandardMaterial({ color, roughness });
}
function mesh(
  g: T.BufferGeometry,
  m: T.Material,
  parent: T.Group,
  x = 0,
  y = 0,
  z = 0,
) {
  const a = new T.Mesh(g, m);
  a.position.set(x, y, z);
  a.castShadow = true;
  a.receiveShadow = true;
  parent.add(a);
  return a;
}
function sphere(
  parent: T.Group,
  m: T.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
) {
  const a = mesh(new T.SphereGeometry(1, 24, 16), m, parent, x, y, z);
  a.scale.set(sx, sy, sz);
  return a;
}
function cylinder(
  parent: T.Group,
  m: T.Material,
  r: number,
  h: number,
  x = 0,
  y = h / 2,
  z = 0,
) {
  return mesh(new T.CylinderGeometry(r, r, h, 48), m, parent, x, y, z);
}
function food(i: Item) {
  const g = new T.Group();
  const main = material(i.color),
    dark = material(new T.Color(i.color).multiplyScalar(0.69).getStyle());
  const pale = material("#edf0c1");
  switch (i.kind) {
    case "zucchini":
      cylinder(g, main, 20, 10);
      cylinder(g, material("#c9d991"), 17.2, 0.5, 0, 10.25);
      cylinder(g, pale, 14.8, 0.5, 0, 10.55);
      for (let n = 0; n < 6; n++) {
        let a = (n * Math.PI) / 3;
        const s = sphere(
          g,
          material("#adbf79"),
          Math.sin(a) * 6,
          11,
          Math.cos(a) * 6,
          1,
          0.4,
          2.1,
        );
        s.rotation.y = -a;
      }
      break;
    case "carrot": {
      const a = mesh(
        new RoundedBoxGeometry(40, 11, 15, 3, 6),
        main,
        g,
        0,
        5.5,
        0,
      );
      a.rotation.y = 0.08;
      for (let n = -14; n <= 14; n += 7) {
        const b = mesh(
          new T.BoxGeometry(0.6, 0.35, 9),
          material("#f8ca86"),
          g,
          n,
          11.1,
          -2,
        );
        b.rotation.y = -0.22;
      }
      break;
    }
    case "broccoli": {
      cylinder(g, material("#9ca963"), 3, 17);
      for (const [x, y, z, r] of [
        [-9, 18, 0, 9],
        [9, 18, -1, 9],
        [0, 24, -5, 10],
        [0, 18, 9, 10],
      ]) {
        sphere(g, main, x, y, z, r, r * 0.85, r);
        for (let n = 0; n < 4; n++) {
          const a = n * 1.7;
          sphere(
            g,
            n % 2 ? dark : material("#86a454"),
            x + Math.sin(a) * r * 0.5,
            y + r * 0.7,
            z + Math.cos(a) * r * 0.5,
            2.4,
            2.2,
            2.4,
          );
        }
      }
      break;
    }
    case "sprout": {
      for (let n = 0; n < 3; n++) {
        const x = (n - 1) * 8;
        const stem = mesh(
          new T.CylinderGeometry(1.1, 1.5, 24, 12),
          main,
          g,
          x,
          12,
          0,
        );
        stem.rotation.z = (n - 1) * 0.2;
        for (let k = 0; k < 3; k++) {
          const leaf = sphere(
            g,
            main,
            x + (k % 2 ? 5 : -5),
            10 + k * 5,
            k - 1,
            5,
            1,
            8,
          );
          leaf.rotation.z = k % 2 ? -0.3 : 0.3;
        }
      }
      break;
    }
    case "asparagus": {
      for (let n = 0; n < 3; n++) {
        const stem = mesh(
          new T.CylinderGeometry(2, 2.4, 58, 16),
          main,
          g,
          0,
          3,
          (n - 1) * 8,
        );
        stem.rotation.z = Math.PI / 2;
        const tip = mesh(
          new T.ConeGeometry(3, 12, 10),
          dark,
          g,
          34,
          3,
          (n - 1) * 8,
        );
        tip.rotation.z = -Math.PI / 2;
      }
      break;
    }
    case "tomato":
      sphere(g, main, 0, 12, 0, 13, 12, 13);
      for (let n = 0; n < 5; n++) {
        const a = n * 1.256;
        const leaf = sphere(
          g,
          material("#5e793e"),
          Math.sin(a) * 4,
          23,
          Math.cos(a) * 4,
          2,
          0.6,
          7,
        );
        leaf.rotation.y = a;
      }
      break;
    case "salmon":
    case "protein": {
      mesh(new RoundedBoxGeometry(40, 13, 25, 3, 5), dark, g, 0, 6.5, 0);
      mesh(new RoundedBoxGeometry(39, 3, 24, 3, 4), main, g, 0, 13, 0);
      for (let n = -13; n <= 13; n += 7) {
        const line = mesh(
          new T.BoxGeometry(1, 0.3, 21),
          material(i.kind === "salmon" ? "#ffe2bf" : "#68412f"),
          g,
          n,
          14.6,
          0,
        );
        line.rotation.y = 0.18;
      }
      break;
    }
    case "scallop":
      cylinder(g, dark, 19, 13);
      cylinder(g, main, 18.5, 1.2, 0, 13.2);
      for (let n = -8; n < 12; n += 6)
        mesh(new T.BoxGeometry(1, 0.2, 25), dark, g, n, 13.9, 0);
      break;
    case "mushroom":
      cylinder(g, material("#e5d4b7"), 4.5, 17);
      sphere(g, dark, 0, 17, 0, 18, 2, 16);
      sphere(g, main, 0, 18, 0, 18, 9, 16);
      break;
    case "quenelle": {
      const a = sphere(g, main, 0, 8, 0, 24, 9, 10);
      a.rotation.y = -0.2;
      break;
    }
    case "flower":
      for (let n = 0; n < 6; n++) {
        const a = (n * Math.PI) / 3;
        const s = sphere(
          g,
          main,
          Math.sin(a) * 8,
          2.2,
          Math.cos(a) * 8,
          4,
          2,
          9,
        );
        s.rotation.y = a;
      }
      sphere(g, material("#deb94c"), 0, 4, 0, 4, 2, 4);
      break;
    case "dot":
      sphere(g, main, 0, 1.5, 0, 9, 2, 9);
      break;
    case "stroke":
      sphere(g, main, -3, 1, 0, 25, 1.2, 8);
      sphere(g, main, 16, 1, 0, 14, 1, 5);
      break;
    case "base":
      sphere(g, main, 0, 1, 0, 25, 1.2, 19);
      break;
    case "line":
      mesh(new RoundedBoxGeometry(44, 1.2, 2.5, 2, 1), main, g, 0, 0.6, 0);
      break;
    default:
      cylinder(g, main, 20, 3);
  }
  // Normalize all authored shapes to a 1 mm bounding box, then apply physical dimensions.
  g.updateMatrixWorld(true);
  const b = new T.Box3().setFromObject(g);
  const size = b.getSize(new T.Vector3());
  const center = b.getCenter(new T.Vector3());
  for (const child of [...g.children])
    child.position.sub(new T.Vector3(center.x, b.min.y, center.z));
  g.scale.set(
    i.width / size.x,
    i.thickness / size.y,
    ((i.flip ? -1 : 1) * i.width) / size.x,
  );
  g.position.set(i.x, 6 + i.elevation, i.z);
  g.rotation.y = (-i.rotation * Math.PI) / 180;
  g.visible = !i.hidden;
  g.userData.itemId = i.id;
  g.traverse((o) => {
    if (o instanceof T.Mesh) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) {
        m.transparent = i.opacity < 1;
        m.opacity = i.opacity;
      }
    }
  });
  return g;
}
function plate(p: Project) {
  const g = new T.Group();
  const m = material(p.plateColor, 0.36);
  m.emissive = new T.Color(p.plateColor);
  m.emissiveIntensity = 0.16;
  if (p.plate === "slate" || p.plate === "rectangle") {
    mesh(
      new RoundedBoxGeometry(300, 6, 220, 4, p.plate === "slate" ? 3 : 13),
      m,
      g,
      0,
      1,
      0,
    );
    if (p.plate === "rectangle") {
      const inner = mesh(
        new RoundedBoxGeometry(270, 0.5, 190, 3, 12),
        material(p.plateColor, 0.4),
        g,
        0,
        4.3,
        0,
      );
      inner.receiveShadow = true;
    }
  } else {
    const bowl = p.plate === "bowl";
    const pts = bowl
      ? [
          [0, 0],
          [90, 0],
          [108, 3],
          [124, 15],
          [130, 23],
          [129, 26],
          [123, 26],
          [107, 9],
          [90, 4],
          [0, 4],
        ]
      : [
          [0, 0],
          [110, 0],
          [137, 4],
          [140, 8],
          [139, 10],
          [132, 10],
          [115, 5],
          [0, 4],
        ];
    const geometry = new T.LatheGeometry(
      pts.map(([x, y]) => new T.Vector2(x, y)),
      96,
    );
    mesh(geometry, m, g);
  }
  if (p.plate === "round" || p.plate === "bowl") {
    const rim = mesh(
      new T.TorusGeometry(p.plate === "bowl" ? 106 : 115, 0.48, 8, 96),
      material(new T.Color(p.plateColor).multiplyScalar(0.84).getStyle()),
      g,
      0,
      p.plate === "bowl" ? 9 : 5.5,
      0,
    );
    rim.rotation.x = Math.PI / 2;
  }
  return g;
}
function dispose(obj: T.Object3D) {
  obj.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Line) {
      o.geometry?.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m?.dispose();
    }
  });
}
function guideObject(id: string) {
  const g = new T.Group();
  if (id === "none") return g;
  const mat = new T.LineDashedMaterial({
    color: "#857967",
    dashSize: 4,
    gapSize: 3,
    transparent: true,
    opacity: 0.7,
    depthTest: false,
  });
  const line = (pts: number[][]) => {
    const a = new T.Line(
      new T.BufferGeometry().setFromPoints(
        pts.map(([x, z]) => new T.Vector3(x, 7, z)),
      ),
      mat,
    );
    a.computeLineDistances();
    a.renderOrder = 5;
    g.add(a);
  };
  const ring = (x: number, z: number, r: number) =>
    line(
      Array.from({ length: 65 }, (_, i) => [
        x + Math.cos((i / 64) * Math.PI * 2) * r,
        z + Math.sin((i / 64) * Math.PI * 2) * r,
      ]),
    );
  switch (id) {
    case "triangular":
      line([
        [0, -90],
        [-85, 65],
        [85, 65],
        [0, -90],
      ]);
      break;
    case "symmetric":
      line([
        [0, -115],
        [0, 115],
      ]);
      line([
        [-110, 0],
        [110, 0],
      ]);
      break;
    case "asymmetric":
      ring(-35, 20, 60);
      ring(70, -55, 23);
      break;
    case "rhythmic":
      for (let x = -80; x <= 80; x += 40) ring(x, Math.sin(x / 65) * 35, 12);
      break;
    case "diagonal":
      line([
        [-90, 70],
        [90, -70],
      ]);
      line([
        [-75, 90],
        [105, -50],
      ]);
      break;
    case "scale":
      for (let n = 0; n < 4; n++) ring(-78 + n * 49, 15 - n * 12, 8 + n * 7);
      break;
    case "horizontal":
      line([
        [-115, -25],
        [115, -25],
      ]);
      line([
        [-115, 25],
        [115, 25],
      ]);
      break;
    case "structured":
      for (const v of [-40, 40]) {
        line([
          [v, -110],
          [v, 110],
        ]);
        line([
          [-110, v],
          [110, v],
        ]);
      }
      break;
  }
  return g;
}
export const Scene = forwardRef<SceneAPI, Props>(function Scene(props, ref) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  const core = useRef<ReturnType<typeof init> | null>(null);
  const [error, setError] = useState("");
  function init(el: HTMLDivElement) {
    const scene = new T.Scene();
    scene.background = new T.Color("#ebe6dc");
    const renderer = new T.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Lienzo tridimensional del emplatado",
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.tabIndex = 0;
    const camera = new T.OrthographicCamera(-210, 210, 210, -210, 0.1, 2200);
    camera.position.set(0, 650, 0.1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 6, 0);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minZoom = 0.5;
    controls.maxZoom = 3;
    controls.maxPolarAngle = 1.3;
    controls.enableRotate = false;
    controls.update();
    scene.add(new T.HemisphereLight("#fffdf5", "#b5b29f", 1.65));
    const light = new T.DirectionalLight("#fff7e6", 2.2);
    light.position.set(-180, 400, -120);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -240,
      right: 240,
      top: 240,
      bottom: -240,
      near: 1,
      far: 1000,
    });
    light.shadow.bias = -0.0008;
    light.shadow.radius = 4;
    scene.add(light);
    const floor = new T.Mesh(
      new T.PlaneGeometry(3000, 3000),
      new T.MeshBasicMaterial({ color: "#ebe6dc" }),
    );
    floor.material.toneMapped = false;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    scene.add(floor);
    const shadowFloor = new T.Mesh(
      new T.PlaneGeometry(3000, 3000),
      new T.ShadowMaterial({ opacity: 0.14 }),
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -3.9;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);
    const items = new T.Group();
    scene.add(items);
    let dish = new T.Group(),
      guides = new T.Group();
    scene.add(dish, guides);
    let selection: T.BoxHelper | null = null;
    let beforeGesture: Item | null = null;
    let dragging = false;
    let startX = 0,
      startY = 0;
    const ray = new T.Raycaster();
    const point = new T.Vector2();
    const plane = new T.Plane(new T.Vector3(0, 1, 0), -6);
    let offset = new T.Vector3();
    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(0.7);
    const gizmo = transform.getHelper();
    scene.add(gizmo);
    const render = () => {
      selection?.update();
      renderer.render(scene, camera);
    };
    const report = () => {
      render();
      latest.current.onCamera(
        Math.round(camera.zoom * 100),
        Math.round(T.MathUtils.radToDeg(controls.getAzimuthalAngle())),
        Math.round(T.MathUtils.radToDeg(controls.getPolarAngle())),
      );
    };
    controls.addEventListener("change", report);
    transform.addEventListener("change", render);
    transform.addEventListener("mouseDown", () => {
      const i = latest.current.project.items.find(
        (i) => i.id === latest.current.selected,
      );
      beforeGesture = i ? structuredClone(i) : null;
    });
    transform.addEventListener("dragging-changed", (e) => {
      controls.enabled = !e.value;
    });
    transform.addEventListener("mouseUp", () => {
      const obj = transform.object;
      if (obj && beforeGesture) {
        const s = beforeGesture;
        const patch =
          latest.current.tool === "rotate"
            ? {
                rotation:
                  ((((-obj.rotation.y * 180) / Math.PI) % 360) + 360) % 360,
              }
            : {
                width: Math.max(
                  2,
                  Math.min(
                    300,
                    s.width *
                      (Math.abs(obj.scale.x) /
                        Math.abs(obj.userData.initialScaleX || 1)),
                  ),
                ),
              };
        latest.current.onChange(s.id, patch);
        beforeGesture = null;
      }
    });
    const ndc = (ev: { clientX: number; clientY: number }) => {
      const r = renderer.domElement.getBoundingClientRect();
      point.set(
        ((ev.clientX - r.left) / r.width) * 2 - 1,
        (-(ev.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(point, camera);
    };
    const hit = (e: PointerEvent) => {
      ndc(e);
      const hits = ray.intersectObjects(items.children, true);
      for (const h of hits) {
        let o: T.Object3D | null = h.object;
        while (o && !o.userData.itemId) o = o.parent;
        if (o && o.visible) return o;
      }
      return null;
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || latest.current.tool !== "move") return;
      const o = hit(e);
      startX = e.clientX;
      startY = e.clientY;
      if (o) {
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        latest.current.onSelect(o.userData.itemId);
        const i = latest.current.project.items.find(
          (i) => i.id === o.userData.itemId,
        );
        if (i && !i.locked) {
          beforeGesture = structuredClone(i);
          ndc(e);
          const intersect = ray.ray.intersectPlane(plane, new T.Vector3());
          offset = intersect ? intersect.sub(o.position) : new T.Vector3();
          dragging = true;
          renderer.domElement.setPointerCapture(e.pointerId);
        }
      }
    };
    const move = (e: PointerEvent) => {
      if (!dragging || !beforeGesture) return;
      ndc(e);
      const pos = ray.ray.intersectPlane(plane, new T.Vector3());
      const obj = items.children.find(
        (o) => o.userData.itemId === beforeGesture!.id,
      );
      if (pos && obj) {
        obj.position.x = T.MathUtils.clamp(pos.x - offset.x, -220, 220);
        obj.position.z = T.MathUtils.clamp(pos.z - offset.z, -220, 220);
        render();
      }
    };
    const up = (e: PointerEvent) => {
      controls.enabled = true;
      if (dragging && beforeGesture) {
        const obj = items.children.find(
          (o) => o.userData.itemId === beforeGesture!.id,
        );
        if (obj && Math.hypot(e.clientX - startX, e.clientY - startY) > 2)
          latest.current.onChange(beforeGesture.id, {
            x: obj.position.x,
            z: obj.position.z,
          });
        dragging = false;
        beforeGesture = null;
        controls.enabled = true;
      } else if (
        latest.current.tool === "move" &&
        Math.hypot(e.clientX - startX, e.clientY - startY) < 3 &&
        !hit(e)
      )
        latest.current.onSelect(null);
    };
    const cancel = () => {
      if (beforeGesture) {
        transform.reset();
        const obj = items.children.find(
          (o) => o.userData.itemId === beforeGesture!.id,
        );
        if (obj) {
          obj.position.x = beforeGesture.x;
          obj.position.z = beforeGesture.z;
        }
        dragging = false;
        beforeGesture = null;
        controls.enabled = true;
        render();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    const dragover = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      ndc(e);
      const pos = ray.ray.intersectPlane(plane, new T.Vector3());
      const kind = e.dataTransfer?.getData("application/mise-resource");
      if (pos && kind)
        latest.current.onAdd(
          kind,
          T.MathUtils.clamp(pos.x, -160, 160),
          T.MathUtils.clamp(pos.z, -160, 160),
        );
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key);
    renderer.domElement.addEventListener("dragover", dragover);
    renderer.domElement.addEventListener("drop", drop);
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const ratio = width / height;
      camera.left = -245 * ratio;
      camera.right = 245 * ratio;
      camera.top = 245;
      camera.bottom = -245;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const update = (p: Props) => {
      transform.detach();
      if (selection) {
        scene.remove(selection);
        dispose(selection);
        selection = null;
      }
      for (const o of [...items.children]) {
        items.remove(o);
        dispose(o);
      }
      scene.remove(dish, guides);
      dispose(dish);
      dispose(guides);
      dish = plate(p.project);
      guides = guideObject(p.guide);
      scene.add(dish, guides);
      for (const i of p.project.items) {
        const obj = food(i);
        obj.userData.initialScaleX = obj.scale.x;
        items.add(obj);
      }
      const selected = items.children.find(
        (o) => o.userData.itemId === p.selected,
      );
      const data = p.project.items.find((i) => i.id === p.selected);
      if (selected && data && !data.hidden) {
        selection = new T.BoxHelper(selected, "#b8431f");
        selection.material.depthTest = false;
        selection.renderOrder = 20;
        scene.add(selection);
        if (p.tool !== "move" && !data.locked) {
          transform.setMode(p.tool === "rotate" ? "rotate" : "scale");
          transform.showX = p.tool === "scale";
          transform.showY = p.tool === "rotate";
          transform.showZ = false;
          transform.attach(selected);
        }
      }
      render();
    };
    let mode: "top" | "perspective" = "top";
    let lastOblique = new T.Vector3(230, 460, 350);
    const setView = (v: "top" | "perspective") => {
      if (mode === "perspective") lastOblique = camera.position.clone();
      mode = v;
      controls.enableRotate = v === "perspective";
      if (v === "top") camera.position.set(0, 650, 0.1);
      else camera.position.copy(lastOblique);
      controls.target.set(0, 6, 0);
      controls.update();
      report();
    };
    const angles = (az: number, inc: number) => {
      const radius = 650;
      const a = (az * Math.PI) / 180,
        phi = Math.max(0.03, Math.min(1.3, (inc * Math.PI) / 180));
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(a),
        6 + radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(a),
      );
      controls.update();
      report();
    };
    const capture = (view: "top" | "current", includeGuides: boolean) => {
      const pos = camera.position.clone(),
        target = controls.target.clone(),
        zoom = camera.zoom;
      const w = renderer.domElement.width / renderer.getPixelRatio(),
        h = renderer.domElement.height / renderer.getPixelRatio();
      const pixelRatio = renderer.getPixelRatio();
      const bounds = [camera.left, camera.right, camera.top, camera.bottom];
      const gv = guides.visible,
        sv = selection?.visible,
        giz = gizmo.visible;
      try {
        if (view === "top") {
          camera.position.set(0, 650, 0.1);
          controls.target.set(0, 6, 0);
          camera.lookAt(controls.target);
        }
        camera.zoom = 1;
        camera.left = -190;
        camera.right = 190;
        camera.top = 190;
        camera.bottom = -190;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(1);
        renderer.setSize(1000, 1000, false);
        guides.visible = includeGuides;
        if (selection) selection.visible = false;
        gizmo.visible = false;
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL("image/png");
      } finally {
        camera.position.copy(pos);
        controls.target.copy(target);
        camera.zoom = zoom;
        [camera.left, camera.right, camera.top, camera.bottom] = bounds;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(w, h, false);
        guides.visible = gv;
        if (selection) selection.visible = sv ?? true;
        gizmo.visible = giz;
        controls.update();
        render();
      }
    };
    return {
      update,
      setView,
      capture,
      zoom: (n: number) => {
        camera.zoom = T.MathUtils.clamp(camera.zoom + n, 0.5, 3);
        camera.updateProjectionMatrix();
        report();
      },
      reset: () => {
        camera.zoom = 1;
        if (mode === "perspective") {
          camera.position.set(230, 460, 350);
          lastOblique = camera.position.clone();
        }
        setView(mode);
      },
      fit: () => {
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        controls.target.set(0, 6, 0);
        controls.update();
        report();
      },
      angles,
      destroy: () => {
        observer.disconnect();
        window.removeEventListener("keydown", key);
        controls.dispose();
        transform.dispose();
        dispose(scene);
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
  }
  useEffect(() => {
    if (!host.current) return;
    try {
      core.current = init(host.current);
      core.current.update(latest.current);
    } catch (e) {
      setError(
        "No se ha podido iniciar el visor 3D. Activa WebGL o prueba un navegador compatible.",
      );
      console.error(e);
    }
    return () => {
      core.current?.destroy();
      core.current = null;
    };
  }, []);
  useEffect(() => {
    core.current?.update(props);
  }, [props.project, props.selected, props.guide, props.tool]);
  useEffect(() => {
    core.current?.setView(props.view);
  }, [props.view]);
  useImperativeHandle(
    ref,
    () => ({
      capture: (v, g) => {
        if (!core.current) throw Error("El visor 3D no está disponible.");
        return core.current.capture(v, g);
      },
      zoom: (n) => core.current?.zoom(n),
      reset: () => core.current?.reset(),
      fit: () => core.current?.fit(),
      angles: (a, i) => core.current?.angles(a, i),
    }),
    [],
  );
  return (
    <div className="scene" ref={host}>
      {error && (
        <div className="webgl-error" role="alert">
          <h3>El visor necesita WebGL</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
});
