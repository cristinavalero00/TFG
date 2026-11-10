export type Item = {
  id: string;
  kind: string;
  name: string;
  x: number;
  z: number;
  width: number;
  rotation: number;
  thickness: number;
  elevation: number;
  color: string;
  opacity: number;
  flip: boolean;
  hidden: boolean;
  locked: boolean;
};
export type Project = {
  id: string;
  name: string;
  plate: string;
  plateColor: string;
  items: Item[];
  notes: string;
  updated: string;
  thumbnail?: string;
};
export type Resource = {
  kind: string;
  name: string;
  category: string;
  color: string;
  width: number;
  thickness: number;
};
export const resources: Resource[] = [
  {
    kind: "zucchini",
    name: "Calabacín",
    category: "Vegetales",
    color: "#668943",
    width: 43,
    thickness: 12,
  },
  {
    kind: "carrot",
    name: "Zanahoria",
    category: "Vegetales",
    color: "#ed942f",
    width: 55,
    thickness: 14,
  },
  {
    kind: "broccoli",
    name: "Brócoli",
    category: "Vegetales",
    color: "#4c773e",
    width: 42,
    thickness: 32,
  },
  {
    kind: "sprout",
    name: "Brotes",
    category: "Vegetales",
    color: "#71924f",
    width: 32,
    thickness: 17,
  },
  {
    kind: "tomato",
    name: "Tomate cherry",
    category: "Vegetales",
    color: "#bd4226",
    width: 26,
    thickness: 24,
  },
  {
    kind: "asparagus",
    name: "Espárrago",
    category: "Vegetales",
    color: "#658b42",
    width: 72,
    thickness: 12,
  },
  {
    kind: "salmon",
    name: "Salmón",
    category: "Proteínas",
    color: "#e99a7d",
    width: 68,
    thickness: 22,
  },
  {
    kind: "protein",
    name: "Pieza de carne",
    category: "Proteínas",
    color: "#9c6143",
    width: 66,
    thickness: 24,
  },
  {
    kind: "scallop",
    name: "Vieira",
    category: "Proteínas",
    color: "#e7c798",
    width: 36,
    thickness: 18,
  },
  {
    kind: "mushroom",
    name: "Seta",
    category: "Guarniciones",
    color: "#aa8668",
    width: 35,
    thickness: 25,
  },
  {
    kind: "quenelle",
    name: "Quenelle",
    category: "Guarniciones",
    color: "#ddc480",
    width: 55,
    thickness: 22,
  },
  {
    kind: "flower",
    name: "Flor comestible",
    category: "Decoración",
    color: "#a57fa3",
    width: 25,
    thickness: 9,
  },
  {
    kind: "dot",
    name: "Punto de salsa",
    category: "Salsas y formas",
    color: "#b65536",
    width: 14,
    thickness: 3,
  },
  {
    kind: "stroke",
    name: "Trazo de salsa",
    category: "Salsas y formas",
    color: "#b65536",
    width: 84,
    thickness: 2,
  },
  {
    kind: "base",
    name: "Base de crema",
    category: "Salsas y formas",
    color: "#8b9c52",
    width: 85,
    thickness: 3,
  },
  {
    kind: "line",
    name: "Línea",
    category: "Salsas y formas",
    color: "#b65536",
    width: 80,
    thickness: 2,
  },
  {
    kind: "circle",
    name: "Forma circular",
    category: "Salsas y formas",
    color: "#d9ba6d",
    width: 42,
    thickness: 4,
  },
];
export const plates = [
  { id: "round", name: "Redonda", description: "Porcelana · Ø 280 mm" },
  { id: "bowl", name: "Honda", description: "Cuenco · Ø 260 mm" },
  { id: "slate", name: "Pizarra", description: "Pizarra · 300 × 220 mm" },
  {
    id: "rectangle",
    name: "Rectangular",
    description: "Porcelana · 300 × 220 mm",
  },
];
export const guides = [
  { id: "none", name: "Ocultas", description: "" },
  {
    id: "symmetric",
    name: "Simétrica",
    description:
      "Distribuye los pesos visuales a ambos lados de un eje. La simetría puede aportar orden y estabilidad.",
  },
  {
    id: "asymmetric",
    name: "Asimétrica",
    description:
      "Equilibra elementos de distinto tamaño y posición. Una pieza pequeña de color intenso puede actuar como contrapunto.",
  },
  {
    id: "rhythmic",
    name: "Rítmica",
    description:
      "Repite elementos o intervalos para construir una secuencia. Puedes variar tamaños para evitar una repetición uniforme.",
  },
  {
    id: "diagonal",
    name: "Oblicua",
    description:
      "Organiza la composición siguiendo una dirección diagonal que conduzca la mirada a través del plato.",
  },
  {
    id: "scale",
    name: "En escala",
    description:
      "Dispón una progresión de tamaños o alturas para establecer una jerarquía entre los elementos.",
  },
  {
    id: "triangular",
    name: "Triangular",
    description:
      "Organiza los puntos de interés alrededor de tres posiciones. La retícula sirve de referencia, sin imponer dónde colocar cada ingrediente.",
  },
  {
    id: "horizontal",
    name: "Horizontal",
    description:
      "Concentra la composición en una franja horizontal, atendiendo a sus extremos y al espacio negativo.",
  },
  {
    id: "structured",
    name: "Estructurada",
    description:
      "Relaciona los elementos mediante una retícula ordenada. La estructura ayuda a comparar alineaciones y distancias.",
  },
];
export function uid() {
  return crypto.randomUUID();
}
export function newProject(): Project {
  return {
    id: uid(),
    name: "Emplatado sin título",
    plate: "round",
    plateColor: "#fffaf0",
    items: [],
    notes: "",
    updated: new Date().toISOString(),
  };
}
export function newItem(kind: string, x = 0, z = 0): Item {
  const r = resources.find((r) => r.kind === kind);
  if (!r) throw Error("Ingrediente desconocido");
  return {
    id: uid(),
    kind,
    name: r.name,
    x,
    z,
    width: r.width,
    thickness: r.thickness,
    rotation: 0,
    elevation: 0,
    color: r.color,
    opacity: 1,
    flip: false,
    hidden: false,
    locked: false,
  };
}
export function demoProject(): Project {
  const p = newProject();
  p.name = "Huerto de temporada";
  p.items = [
    newItem("stroke", -10, 45),
    newItem("carrot", -50, -15),
    newItem("broccoli", 40, -48),
    newItem("zucchini", 55, 25),
  ];
  p.items[0].width = 112;
  p.items[1].rotation = 25;
  return p;
}
export const fingerprint = (p: Project) =>
  JSON.stringify({
    name: p.name,
    plate: p.plate,
    plateColor: p.plateColor,
    items: p.items,
    notes: p.notes,
  });
export const STORAGE = "mise-en-place.projects.v1";
const number = (x: unknown) => typeof x === "number" && Number.isFinite(x);
export function isProject(x: unknown): x is Project {
  if (!x || typeof x !== "object") return false;
  const p = x as Project;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    typeof p.notes === "string" &&
    typeof p.updated === "string" &&
    plates.some((t) => t.id === p.plate) &&
    /^#[0-9a-f]{6}$/i.test(p.plateColor) &&
    Array.isArray(p.items) &&
    p.items.every(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.name === "string" &&
        resources.some((r) => r.kind === i.kind) &&
        [
          i.x,
          i.z,
          i.width,
          i.rotation,
          i.thickness,
          i.elevation,
          i.opacity,
        ].every(number) &&
        Math.abs(i.x) <= 1000 &&
        Math.abs(i.z) <= 1000 &&
        i.width >= 1 &&
        i.width <= 300 &&
        i.thickness >= 0.2 &&
        i.thickness <= 120 &&
        i.elevation >= 0 &&
        i.elevation <= 200 &&
        i.opacity >= 0.1 &&
        i.opacity <= 1 &&
        /^#[0-9a-f]{6}$/i.test(i.color) &&
        ["flip", "hidden", "locked"].every(
          (k) => typeof i[k as keyof Item] === "boolean",
        ),
    ) &&
    new Set(p.items.map((i) => i.id)).size === p.items.length
  );
}
export function readProjects(
  storage: Pick<Storage, "getItem"> = localStorage,
): Project[] {
  const raw = storage.getItem(STORAGE);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isProject))
    throw Error(
      "Los datos guardados no tienen un formato válido. No se han modificado.",
    );
  return parsed;
}
export function writeProjects(
  projects: Project[],
  storage: Pick<Storage, "setItem"> = localStorage,
) {
  if (!projects.every(isProject))
    throw Error("El proyecto contiene datos no válidos.");
  storage.setItem(STORAGE, JSON.stringify(projects));
}
export function moveItem(
  p: Project,
  id: string,
  patch: Partial<Item>,
): Project {
  return {
    ...p,
    items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  };
}
export function fileName(s: string) {
  return (
    s
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "emplatado"
  );
}
