import { itemDepth, reorderLayer } from "./composition";
import { ColorAnalysis } from "./ColorAnalysis";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Search,
  Undo2,
  Redo2,
  Download,
  Pencil,
  Check,
  X,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  LockKeyhole,
  UnlockKeyhole,
  RotateCw,
  Move,
  Maximize2,
  Minus,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  BookOpen,
  MousePointer2,
  SlidersHorizontal,
  Save,
  Leaf,
  CircleCheck,
  AlertCircle,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  FlipHorizontal2,
  GripVertical,
  FileDown,
  Flower2,
} from "lucide-react";
import type { SceneAPI } from "./Scene";
const Scene = lazy(() => import("./Scene").then((m) => ({ default: m.Scene })));
import { Food, PlateArt } from "./Illustration";
import {
  demoProject,
  fileName,
  fingerprint,
  guides,
  isProject,
  moveItem,
  newItem,
  newProject,
  plates,
  readProjects,
  resources,
  uid,
  writeProjects,
  type Item,
  type Project,
} from "./model";

type Page = "home" | "editor" | "guide" | "help";
type Dialog = "export" | "leave" | "deleteProject" | "rename" | null;
const clone = <T,>(v: T): T => structuredClone(v);
function IconButton({
  label,
  children,
  onClick,
  disabled = false,
  active = false,
  danger = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "is-active" : ""} ${danger ? "danger" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const focused = document.activeElement;
    ref.current?.showModal();
    return () => {
      if (focused instanceof HTMLElement) focused.focus();
    };
  }, []);
  return (
    <dialog
      className={`modal ${wide ? "modal-wide" : ""}`}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <IconButton label="Cerrar ventana" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onCommit,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 10) / 10)),
    [err, setErr] = useState(false);
  useEffect(() => {
    setDraft(String(Math.round(value * 10) / 10));
    setErr(false);
  }, [value]);
  const apply = () => {
    const n = Number(draft);
    if (!draft.trim() || !Number.isFinite(n) || n < min || n > max) {
      setErr(true);
      return;
    }
    setErr(false);
    if (n !== value) onCommit(n);
  };
  return (
    <label className="number-field">
      <span>{label}</span>
      <div className={`unit-field ${err ? "field-error" : ""}`}>
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              apply();
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setDraft(String(value));
              setErr(false);
            }
          }}
        />
        <span>{unit}</span>
      </div>
      {err && (
        <small role="alert">
          Introduce un valor entre {min} y {max}.
        </small>
      )}
    </label>
  );
}
function downloadData(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}
const HELP = [
  ["Primeros pasos", "Tu primer emplatado"],
  ["Añadir ingredientes", "Una biblioteca para componer"],
  ["Mover, girar y escalar", "Ajusta cada elemento"],
  ["Vistas y composición", "Observa desde otro ángulo"],
  ["Guardar y exportar", "Conserva tu trabajo"],
  ["Atajos de teclado", "Trabaja con el teclado"],
];
export default function App() {
  const [page, setPage] = useState<Page>("home"),
    [projects, setProjects] = useState<Project[]>([]),
    [storageError, setStorageError] = useState(""),
    [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<Project[]>([]),
    [cursor, setCursor] = useState(0);
  const project = history[cursor];
  const [saved, setSaved] = useState("");
  const dirty = !!project && fingerprint(project) !== saved;
  const [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("Ingredientes"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todos");
  const item = project?.items.find((i) => i.id === selected);
  const [view, setView] = useState<"top" | "perspective">("top"),
    [guide, setGuide] = useState("none"),
    [drawer, setDrawer] = useState<"composition" | "color" | null>(null),
    [tool, setTool] = useState<"move" | "rotate" | "scale">("move");
  const [zoom, setZoom] = useState(100),
    [az, setAz] = useState(35),
    [inc, setInc] = useState(45),
    [advanced, setAdvanced] = useState(false),
    [panelHidden, setPanelHidden] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null),
    [targetProject, setTargetProject] = useState<Project | null>(null),
    [nameDraft, setNameDraft] = useState(""),
    [renameError, setRenameError] = useState("");
  const nextPage = useRef<Page>("home");
  const [saveState, setSaveState] = useState<
      "idle" | "saving" | "saved" | "error"
    >("idle"),
    [saveError, setSaveError] = useState(""),
    [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
      null,
    ),
    [helpTopic, setHelpTopic] = useState(0),
    [menu, setMenu] = useState<string | null>(null);
  const [format, setFormat] = useState<"pdf" | "png">("pdf"),
    [exportView, setExportView] = useState<"top" | "current">("top"),
    [includeGuides, setIncludeGuides] = useState(false),
    [exportNotes, setExportNotes] = useState(""),
    [preview, setPreview] = useState(""),
    [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState("");
  const scene = useRef<SceneAPI>(null);
  const [paintReady, setPaintReady] = useState(true);
  const latest = useRef({ project, dirty, selected, dialog, drawer, page });
  latest.current = { project, dirty, selected, dialog, drawer, page };
  const notify = (message: string, error = false) =>
    setToast({ message, error });
  useEffect(() => {
    try {
      setProjects(readProjects());
    } catch (e) {
      setStorageError(
        e instanceof Error
          ? e.message
          : "No se puede acceder al almacenamiento.",
      );
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (latest.current.dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  const commit = useCallback(
    (updater: Project | ((p: Project) => Project)) => {
      setHistory((h) => {
        const c = cursor;
        const old = h[c];
        if (!old) return h;
        const next = typeof updater === "function" ? updater(old) : updater;
        if (fingerprint(next) === fingerprint(old)) return h;
        const nextHist = [...h.slice(0, c + 1), clone(next)].slice(-101);
        setCursor(nextHist.length - 1);
        return nextHist;
      });
      setSaveState("idle");
    },
    [cursor],
  );
  const patchItem = useCallback(
    (id: string, patch: Partial<Item>) => commit((p) => moveItem(p, id, patch)),
    [commit],
  );
  const undo = () => {
    if (cursor > 0) {
      setCursor(cursor - 1);
      setSaveState("idle");
      setSelected(null);
    }
  };
  const redo = () => {
    if (cursor < history.length - 1) {
      setCursor(cursor + 1);
      setSaveState("idle");
      setSelected(null);
    }
  };
  const open = (p: Project, isSaved = false) => {
    setHistory([clone(p)]);
    setCursor(0);
    setSaved(isSaved ? fingerprint(p) : "");
    setSelected(null);
    setView("top");
    setGuide("none");
    setDrawer(null);
    setTool("move");
    setTab(p.items.length ? "Ingredientes" : "Vajilla");
    setQuery("");
    setCategory("Todos");
    setSaveState("idle");
    setPage("editor");
  };
  const create = () => open(newProject());
  const navigate = (to: Page) => {
    setMenu(null);
    if (to === "home" && dirty) {
      nextPage.current = to;
      setDialog("leave");
    } else {
      setDrawer(null);
      if (to === "home") {
        setHistory([]);
        setCursor(0);
        setSaved("");
      }
      setPage(to);
    }
  };
  const add = useCallback(
    (kind: string, x?: number, z?: number) => {
      const o = newItem(
        kind,
        x ?? (((project?.items.length || 0) % 5) - 2) * 12,
        z ?? (((project?.items.length || 0) % 4) - 1) * 10,
      );
      commit((p) => ({ ...p, items: [...p.items, o] }));
      setSelected(o.id);
      setTool("move");
    },
    [commit, project?.items.length],
  );
  const remove = () => {
    if (!item || item.locked) return;
    commit((p) => ({ ...p, items: p.items.filter((i) => i.id !== item.id) }));
    setSelected(null);
  };
  const duplicateItem = () => {
    if (!item) return;
    const copy = {
      ...clone(item),
      id: uid(),
      x: item.x + 12,
      z: item.z + 12,
      locked: false,
    };
    commit((p) => ({ ...p, items: [...p.items, copy] }));
    setSelected(copy.id);
  };
  const store = async () => {
    if (!project || saveState === "saving") return false;
    setSaveState("saving");
    setSaveError("");
    try {
      if (storageError)
        throw Error(
          "No se puede guardar hasta resolver el acceso a los proyectos existentes.",
        );
      const p = {
        ...clone(project),
        updated: new Date().toISOString(),
        thumbnail: scene.current?.capture("top", false) || project.thumbnail,
      };
      await new Promise((r) => setTimeout(r, 80));
      const existing = readProjects();
      const list = [p, ...existing.filter((q) => q.id !== p.id)];
      writeProjects(list);
      setProjects(list);
      setSaved(fingerprint(p));
      setSaveState("saved");
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "El navegador no ha podido guardar.";
      setSaveError(message);
      setSaveState("error");
      notify("No se ha podido guardar. Tu trabajo sigue abierto.", true);
      return false;
    }
  };
  const rename = (p: Project) => {
    setTargetProject(p);
    setNameDraft(p.name);
    setRenameError("");
    setDialog("rename");
    setMenu(null);
  };
  const confirmRename = () => {
    if (!nameDraft.trim()) {
      setRenameError("Escribe un nombre para el emplatado.");
      return;
    }
    const name = nameDraft.trim().slice(0, 100);
    if (targetProject?.id === project?.id && page === "editor") {
      commit((p) => ({ ...p, name }));
      setDialog(null);
    } else if (targetProject) {
      try {
        const list = readProjects().map((p) =>
          p.id === targetProject.id
            ? { ...p, name, updated: new Date().toISOString() }
            : p,
        );
        writeProjects(list);
        setProjects(list);
        setDialog(null);
      } catch {
        setRenameError("No se ha podido guardar el nuevo nombre.");
      }
    }
  };
  const duplicateProject = (p: Project) => {
    try {
      const copy = {
        ...clone(p),
        id: uid(),
        name: `Copia de ${p.name}`.slice(0, 100),
        updated: new Date().toISOString(),
      };
      const list = [copy, ...readProjects()];
      writeProjects(list);
      setProjects(list);
      setMenu(null);
      notify("Copia guardada en este navegador.");
    } catch {
      notify("No se ha podido duplicar el proyecto.", true);
    }
  };
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const editing = t.matches(
        'input,textarea,select,[contenteditable="true"]',
      );
      if (editing || latest.current.dialog) return;
      if (latest.current.page !== "editor") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void store();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateItem();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
      if (e.key === "Escape") {
        if (drawer) setDrawer(null);
        else setSelected(null);
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        item &&
        !item.locked
      ) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        patchItem(item.id, {
          x:
            item.x +
            (e.key === "ArrowRight"
              ? delta
              : e.key === "ArrowLeft"
                ? -delta
                : 0),
          z:
            item.z +
            (e.key === "ArrowDown" ? delta : e.key === "ArrowUp" ? -delta : 0),
        });
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  useEffect(() => {
    if (dialog !== "export" || !project) return;
    if (!paintReady) {
      setPreview("");
      setExportError("");
      return;
    }
    try {
      setPreview(scene.current?.capture(exportView, includeGuides) || "");
      setExportError("");
    } catch {
      setExportError("No se ha podido generar la vista previa.");
    }
  }, [dialog, exportView, includeGuides, project, paintReady]);
  const openExport = () => {
    setFormat("pdf");
    setExportView("top");
    setIncludeGuides(false);
    setExportNotes(project.notes);
    setExportError("");
    setDialog("export");
  };
  const exportFile = async () => {
    if (!project || !preview) return;
    setExporting(true);
    setExportError("");
    try {
      await new Promise((r) => setTimeout(r, 50));
      const img = scene.current!.capture(exportView, includeGuides);
      if (format === "png") downloadData(img, `${fileName(project.name)}.png`);
      else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
        for (const [file, font, style] of [
          ["PublicSans-Regular.ttf", "PublicSans", "normal"],
          ["PublicSans-Semibold.ttf", "PublicSans", "bold"],
          ["DMSerifDisplay-Regular.ttf", "DMSerifDisplay", "normal"],
        ]) {
          const response = await fetch("/fonts/" + file);
          if (!response.ok)
            throw Error("No se ha podido cargar la tipografía del PDF.");
          const bytes = new Uint8Array(await response.arrayBuffer());
          let binary = "";
          for (const byte of bytes) binary += String.fromCharCode(byte);
          pdf.addFileToVFS(file, btoa(binary));
          pdf.addFont(file, font, style);
        }
        pdf.setFillColor("#f7f1e5");
        pdf.rect(0, 0, 210, 297, "F");
        pdf.setTextColor("#30321d");
        pdf.setFont("PublicSans", "bold");
        pdf.setFontSize(11);
        pdf.text("MISE EN PLACE", 18, 19);
        pdf.setFont("PublicSans", "normal");
        pdf.setFontSize(9);
        pdf.text("Ficha técnica visual", 18, 26);
        pdf.setFont("DMSerifDisplay", "normal");
        pdf.setFontSize(22);
        const title = pdf.splitTextToSize(project.name, 174);
        pdf.text(title, 18, 41);
        let y = 45 + title.length * 8;
        pdf.addImage(img, "PNG", 30, y, 150, 150, undefined, "FAST");
        y += 160;
        const ensure = (height: number) => {
          if (y + height > 278) {
            pdf.addPage();
            pdf.setFillColor("#f7f1e5");
            pdf.rect(0, 0, 210, 297, "F");
            y = 22;
          }
        };
        pdf.setFontSize(12);
        pdf.setFont("PublicSans", "bold");
        ensure(15);
        pdf.text("Elementos del emplatado", 18, y);
        y += 8;
        pdf.setFontSize(10);
        pdf.setFont("PublicSans", "normal");
        for (const i of project.items.filter((i) => !i.hidden)) {
          const text = `${i.name} · ${Math.round(i.width)} mm · grosor ${Math.round(i.thickness)} mm`;
          const lines = pdf.splitTextToSize(text, 174);
          ensure(lines.length * 5 + 3);
          pdf.text(lines, 18, y);
          y += lines.length * 5 + 2;
        }
        if (exportNotes.trim()) {
          ensure(17);
          y += 7;
          pdf.setFont("PublicSans", "bold");
          pdf.text("Notas de montaje", 18, y);
          y += 7;
          pdf.setFont("PublicSans", "normal");
          for (const line of pdf.splitTextToSize(exportNotes, 174)) {
            ensure(6);
            pdf.text(line, 18, y);
            y += 5;
          }
        }
        for (let p = 1; p <= pdf.getNumberOfPages(); p++) {
          pdf.setPage(p);
          pdf.setFontSize(8);
          pdf.setTextColor("#686658");
          pdf.text(
            `Mise en Place · ${new Date().toLocaleDateString("es-ES")} · ${p}/${pdf.getNumberOfPages()}`,
            18,
            288,
          );
        }
        pdf.save(`${fileName(project.name)}.pdf`);
        if (exportNotes !== project.notes)
          commit((p) => ({ ...p, notes: exportNotes }));
      }
      setDialog(null);
      notify("Archivo generado. La descarga se ha iniciado.");
    } catch (e) {
      setExportError(
        "No se ha podido generar el archivo. Tu composición sigue abierta.",
      );
      console.error(e);
    } finally {
      setExporting(false);
    }
  };
  const exportBackup = () => {
    if (!project) return;
    downloadData(
      "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify({ version: 1, project }, null, 2)),
      `${fileName(project.name)}.mise.json`,
    );
    notify("Copia editable descargada.");
  };
  const importRef = useRef<HTMLInputElement>(null);
  const importProject = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw Error("El archivo supera 5 MB.");
      const raw = JSON.parse(await file.text());
      const p = raw.project;
      if (raw.version !== 1 || !isProject(p))
        throw Error("El archivo no es un proyecto válido de Mise en Place.");
      open({ ...p, id: uid(), thumbnail: undefined }, false);
      notify("Copia abierta. Guarda para conservarla en este navegador.");
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "No se puede abrir este archivo.",
        true,
      );
    }
  };
  const globalHeader = (
    <header className="global-header">
      <button className="wordmark" onClick={() => navigate("home")}>
        Mise en Place<span>Diseña tus emplatados</span>
      </button>
      <nav aria-label="Navegación principal">
        {(["home", "guide", "help"] as Page[]).map((p, i) => (
          <button
            key={p}
            aria-current={page === p ? "page" : undefined}
            className={page === p ? "current" : ""}
            onClick={() => navigate(p)}
          >
            {["Mis emplatados", "Guía de emplatado", "Ayuda"][i]}
          </button>
        ))}
      </nav>
      {project && page !== "editor" && (
        <button
          className="button secondary back-to"
          onClick={() => setPage("editor")}
        >
          <ArrowLeft size={16} /> Volver al emplatado
        </button>
      )}
    </header>
  );
  const colorContent = <ColorAnalysis project={project} selected={item} />;
  const helpContent = (
    <>
      {helpTopic === 0 ? (
        <>
          <h2>Tu primer emplatado</h2>
          <ol className="steps">
            {[
              [
                "Elige la vajilla",
                "Selecciona un soporte desde la biblioteca del editor.",
              ],
              [
                "Añade y coloca los elementos",
                "Pulsa un ingrediente o arrástralo al plato. Selecciónalo para ajustar sus propiedades.",
              ],
              [
                "Revisa la composición",
                "Activa una guía o cambia de ángulo para valorar el conjunto.",
              ],
              [
                "Conserva tu trabajo",
                "Guarda el proyecto editable en este navegador o exporta una ficha visual.",
              ],
            ].map(([a, b], i) => (
              <li key={a}>
                <span>{i + 1}</span>
                <div>
                  <h3>{a}</h3>
                  <p>{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : helpTopic === 1 ? (
        <>
          <h2>Una biblioteca para componer</h2>
          <p>
            Vajilla cambia el soporte sin borrar los alimentos. Ingredientes
            reúne vegetales, proteínas, guarniciones y decoración. Salsas y
            formas incluye puntos, trazos y bases editables.
          </p>
          <p>
            Pulsa una tarjeta para añadir un elemento al centro, o arrástrala
            hasta una posición del lienzo. Cada instancia es independiente. La
            búsqueda filtra la categoría activa.
          </p>
          <p>
            Al cambiar de vajilla, las posiciones se conservan. Revisa si algún
            elemento queda fuera del nuevo soporte.
          </p>
        </>
      ) : helpTopic === 2 ? (
        <>
          <h2>Ajusta cada elemento</h2>
          <p>
            Selecciona en el plato o en Capas. Arrastra para mover; usa los
            campos para ajustar ancho, fondo, rotación, grosor, elevación y opacidad.
            El color modifica el material principal, conservando detalles del
            alimento.
          </p>
          <p>
            Los modos Girar y Escalar muestran un control sobre la selección en
            cenital. Vuelve a Mover para desplazarla. Las flechas del teclado
            mueven 1 mm; Mayús + flecha mueve 10 mm.
          </p>
          <p>
            Grosor modifica el volumen del ingrediente. Elevación lo separa de
            la superficie del plato. No se simulan gravedad ni colisiones. El
            orden de Capas organiza la lista; la posición 3D determina qué se ve
            delante.
          </p>
        </>
      ) : helpTopic === 3 ? (
        <>
          <h2>Observa desde otro ángulo</h2>
          <p>
            Cenital sitúa la cámara sobre el plato. Perspectiva permite girar la
            cámara arrastrando el fondo o utilizando los controles de giro e
            inclinación. Arrastrar un alimento mueve ese alimento, sin girar la
            cámara.
          </p>
          <p>
            El zoom y Encuadrar plato solo cambian la vista. Restablecer vista
            recupera la orientación inicial. Las guías se pueden activar u
            ocultar sin mover los ingredientes.
          </p>
        </>
      ) : helpTopic === 4 ? (
        <>
          <h2>Conserva tu trabajo</h2>
          <p>
            Guardar conserva el proyecto en este navegador. No se sincroniza
            entre dispositivos y puede perderse al borrar sus datos. Usa
            Descargar copia editable para conservar un archivo transportable y
            Abrir copia para recuperarlo.
          </p>
          <p>
            Exportar crea una imagen PNG o una ficha PDF con los elementos
            visibles y tus notas de montaje. Elige vista cenital o actual e
            incluye guías solo si las necesitas. Exportar no guarda
            automáticamente el proyecto editable.
          </p>
          <p>
            Ante un error de guardado el trabajo permanece abierto. No cierres
            la pestaña sin resolverlo o descargar una copia editable.
          </p>
        </>
      ) : (
        <>
          <h2>Trabaja con el teclado</h2>
          <table className="shortcut-table">
            <tbody>
              {[
                ["Ctrl / ⌘ + S", "Guardar"],
                ["Ctrl / ⌘ + Z", "Deshacer"],
                ["Ctrl / ⌘ + Mayús + Z", "Rehacer"],
                ["Ctrl + Y", "Rehacer en Windows / Linux"],
                ["Ctrl / ⌘ + D", "Duplicar selección"],
                ["Suprimir / Retroceso", "Eliminar selección en el lienzo"],
                ["Flechas / Mayús + flechas", "Mover 1 mm / 10 mm"],
                ["Escape", "Cancelar un arrastre o cerrar la consulta"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td>
                    <kbd>{k}</kbd>
                  </td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Los atajos de edición de texto se conservan cuando escribes en un
            campo.
          </p>
        </>
      )}
      <div className="local-note">
        <AlertCircle size={18} />
        <p>
          Los proyectos se guardan en este navegador. Borrar sus datos puede
          eliminar los emplatados guardados.
        </p>
      </div>
    </>
  );
  return (
    <>
      {page !== "editor" && globalHeader}
      {page === "home" && (
        <main className="home page-shell">
          <div className="home-heading">
            <div>
              <span className="small-label">Tu espacio de composición</span>
              <h1>
                Mis emplatados<span className="title-dot">.</span>
              </h1>
              <p>Una idea, un plato y todo el espacio para probar.</p>
            </div>
            <div className="home-actions">
              <button
                className="button secondary"
                onClick={() => importRef.current?.click()}
              >
                <FileDown size={17} /> Abrir copia
              </button>
              <button className="button primary" onClick={create}>
                <Plus size={18} /> Nuevo emplatado
              </button>
            </div>
          </div>
          {storageError && (
            <div className="error-banner" role="alert">
              <AlertCircle size={22} />
              <div>
                <strong>No se han podido leer los proyectos</strong>
                <p>{storageError} Los datos existentes no se han borrado.</p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  try {
                    setProjects(readProjects());
                    setStorageError("");
                  } catch {
                    notify("El acceso sigue sin estar disponible.", true);
                  }
                }}
              >
                Reintentar
              </button>
            </div>
          )}
          {!loaded ? (
            <p>Cargando proyectos…</p>
          ) : projects.length ? (
            <>
              <div className="collection-meta">
                <span>
                  {projects.length}{" "}
                  {projects.length === 1
                    ? "emplatado guardado"
                    : "emplatados guardados"}
                </span>
                <span>Guardados en este navegador</span>
              </div>
              <section
                className="project-grid"
                aria-label="Proyectos guardados"
              >
                {projects.map((p) => (
                  <article className="project-card" key={p.id}>
                    <button
                      className="project-open"
                      onClick={() => open(p, true)}
                      aria-label={`Abrir ${p.name}`}
                    >
                      <div className="project-image">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={`Composición de ${p.name}`}
                          />
                        ) : (
                          <PlateArt filled />
                        )}
                      </div>
                      <h2>{p.name}</h2>
                      <p>
                        Modificado el{" "}
                        {new Date(p.updated).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </button>
                    <div className="project-menu">
                      <IconButton
                        label={`Opciones de ${p.name}`}
                        onClick={() => setMenu(menu === p.id ? null : p.id)}
                      >
                        <MoreHorizontal size={21} />
                      </IconButton>
                      {menu === p.id && (
                        <div className="dropdown">
                          <button
                            onClick={() => {
                              open(p, true);
                              setMenu(null);
                            }}
                          >
                            <MousePointer2 size={16} />
                            Abrir
                          </button>
                          <button onClick={() => duplicateProject(p)}>
                            <Copy size={16} />
                            Duplicar
                          </button>
                          <button onClick={() => rename(p)}>
                            <Pencil size={16} />
                            Cambiar nombre
                          </button>
                          <button
                            className="danger"
                            onClick={() => {
                              setTargetProject(p);
                              setDialog("deleteProject");
                              setMenu(null);
                            }}
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                <button className="new-project-card" onClick={create}>
                  <span>
                    <Plus size={24} />
                  </span>
                  <h2>Otra idea en el plato</h2>
                  <p>Crear un nuevo emplatado</p>
                </button>
              </section>
            </>
          ) : (
            <section className="empty-home">
              <div className="empty-illustration">
                <span className="little-leaf">
                  <Leaf size={30} />
                </span>
                <PlateArt />
                <span className="little-dot" />
              </div>
              <h2>Tu próximo plato empieza aquí.</h2>
              <p>
                Compón, prueba y encuentra el equilibrio.
                <br />
                Crea tu primer emplatado a tu ritmo.
              </p>
              <button className="button primary" onClick={create}>
                <Plus size={18} /> Crear mi primer emplatado
              </button>
              <button
                className="text-button example-link"
                onClick={() => open(demoProject())}
              >
                O explorar un emplatado de ejemplo <ArrowRight size={15} />
              </button>
            </section>
          )}
          <footer className="home-footer">
            <span>
              <span className="status-dot" /> Guardado local · Sin cuentas
            </span>
            <p>
              Tus ideas se quedan en este navegador. Puedes descargar una copia
              editable.
            </p>
            <span>Mise en Place</span>
          </footer>
        </main>
      )}
      {page === "editor" && project && (
        <div className="editor">
          <header className="editor-header">
            <button className="back-button" onClick={() => navigate("home")}>
              <ArrowLeft size={16} />
              <span>Mis emplatados</span>
            </button>
            <div className="project-title">
              <button
                onClick={() => rename(project)}
                title="Cambiar nombre del emplatado"
              >
                {project.name}
                <Pencil size={14} />
              </button>
              <span className={saveState === "error" ? "save-error" : ""}>
                {saveState === "saving"
                  ? "Guardando…"
                  : saveState === "error"
                    ? "No se ha podido guardar"
                    : dirty
                      ? "Cambios sin guardar"
                      : "Guardado en este navegador"}
              </span>
            </div>
            <div className="history-controls">
              <IconButton
                label="Deshacer (Ctrl/⌘ + Z)"
                onClick={undo}
                disabled={cursor === 0}
              >
                <Undo2 size={20} />
              </IconButton>
              <IconButton
                label="Rehacer (Ctrl/⌘ + Mayús + Z)"
                onClick={redo}
                disabled={cursor >= history.length - 1}
              >
                <Redo2 size={20} />
              </IconButton>
            </div>
            <div className="editor-header-actions">
              <button
                className={`header-link ${drawer ? "current" : ""}`}
                onClick={() => setDrawer(drawer ? null : "composition")}
              >
                <BookOpen size={16} />
                <span>Guía</span>
              </button>
              <button className="header-link" onClick={() => setPage("help")}>
                <CircleHelp size={16} />
                <span>Ayuda</span>
              </button>
              <button
                className="button secondary save-button"
                onClick={() => void store()}
                disabled={saveState === "saving"}
              >
                {saveState === "saving" ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{saveState === "saving" ? "Guardando…" : "Guardar"}</span>
              </button>
              <button className="button primary" onClick={openExport}>
                <Download size={16} />
                <span>Exportar</span>
              </button>
            </div>
          </header>
          {saveState === "error" && (
            <div className="editor-save-error" role="alert">
              <AlertCircle size={16} />
              <span>{saveError} Tu trabajo permanece abierto.</span>
              <button onClick={() => void store()}>Reintentar</button>
              <button onClick={exportBackup}>Descargar copia editable</button>
            </div>
          )}
          <div
            className={`editor-workspace ${panelHidden ? "library-hidden" : ""}`}
          >
            <aside className="library" aria-label="Biblioteca gastronómica">
              <div className="panel-title">
                <h2>Añadir al plato</h2>
                <IconButton
                  label="Plegar biblioteca"
                  onClick={() => setPanelHidden(true)}
                >
                  <PanelLeftClose size={17} />
                </IconButton>
              </div>
              <div className="library-tabs">
                {["Vajilla", "Ingredientes", "Salsas y formas"].map((t, i) => (
                  <button
                    key={t}
                    className={tab === t ? "active" : ""}
                    onClick={() => {
                      setTab(t);
                      setQuery("");
                      setCategory("Todos");
                    }}
                  >
                    {i === 0 ? (
                      <span className="plate-icon" />
                    ) : i === 1 ? (
                      <Leaf size={16} />
                    ) : (
                      <SlidersHorizontal size={16} />
                    )}
                    <span>{t}</span>
                    {tab === t && <ChevronRight size={15} />}
                  </button>
                ))}
              </div>
              <label className="search-field">
                <Search size={16} />
                <input
                  placeholder="Buscar en biblioteca…"
                  aria-label="Buscar en biblioteca"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              {tab === "Ingredientes" && (
                <div className="category-filter">
                  <label htmlFor="category">Categoría</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[
                      "Todos",
                      "Vegetales",
                      "Proteínas",
                      "Guarniciones",
                      "Decoración",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="library-list">
                {tab === "Vajilla" ? (
                  <>
                    {plates
                      .filter((p) =>
                        p.name
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase()),
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          className={`resource-card dish-card ${project.plate === p.id ? "chosen" : ""}`}
                          onClick={() =>
                            commit((q) => ({
                              ...q,
                              plate: p.id,
                              plateColor:
                                p.id === "slate" ? "#454740" : "#fffaf0",
                            }))
                          }
                        >
                          <div className="resource-image">
                            <PlateArt shape={p.id} />
                          </div>
                          <span>
                            <strong>{p.name}</strong>
                            <small>{p.description}</small>
                          </span>
                          {project.plate === p.id && <Check size={15} />}
                        </button>
                      ))}
                    <label className="plate-color">
                      Color de la vajilla
                      <input
                        type="color"
                        aria-label="Color de la vajilla"
                        value={project.plateColor}
                        onChange={(e) =>
                          commit((p) => ({ ...p, plateColor: e.target.value }))
                        }
                      />
                    </label>
                    <p className="panel-caption">
                      Cambiar de vajilla conserva la posición de los
                      ingredientes.
                    </p>
                  </>
                ) : (
                  (() => {
                    const list = resources.filter(
                      (r) =>
                        (tab === "Salsas y formas"
                          ? r.category === "Salsas y formas"
                          : r.category !== "Salsas y formas" &&
                            (category === "Todos" ||
                              category === r.category)) &&
                        r.name
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase()),
                    );
                    return list.length ? (
                      list.map((r) => (
                        <button
                          key={r.kind}
                          className="resource-card"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/mise-resource",
                              r.kind,
                            );
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          onClick={() => add(r.kind)}
                          aria-label={`Añadir ${r.name}`}
                        >
                          <div className="resource-image">
                            <Food kind={r.kind} color={r.color} />
                          </div>
                          <span>
                            <strong>{r.name}</strong>
                            <small>Añadir al plato</small>
                          </span>
                          <Plus size={14} className="resource-plus" />
                        </button>
                      ))
                    ) : (
                      <div className="no-results">
                        <Search size={24} />
                        <p>No hay coincidencias.</p>
                        <button
                          className="text-button"
                          onClick={() => {
                            setQuery("");
                            setCategory("Todos");
                          }}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>
              <div className="library-bottom">
                <MousePointer2 size={14} />
                <span>Pulsa o arrastra al plato</span>
              </div>
            </aside>
            <main className="canvas-area" aria-label="Editor del emplatado">
              {panelHidden && (
                <button
                  className="reopen-library"
                  onClick={() => setPanelHidden(false)}
                  aria-label="Abrir biblioteca"
                >
                  <PanelLeftOpen size={19} />
                </button>
              )}
              <Suspense
                fallback={
                  <div className="scene-loading">
                    <LoaderCircle size={24} className="spin" />
                    <span>Preparando el espacio de trabajo…</span>
                  </div>
                }
              >
                <Scene
                  ref={scene}
                  project={project}
                  selected={selected}
                  view={view}
                  guide={guide}
                  tool={tool}
                  onSelect={setSelected}
                  onChange={patchItem}
                  onAdd={add}
                  onMaterialsReady={setPaintReady}
                  onCamera={(z, a, i) => {
                    setZoom(z);
                    if (view === "perspective") {
                      setAz(a);
                      setInc(i);
                    }
                  }}
                />
              </Suspense>
              <div className="canvas-top">
                <div className="segmented" aria-label="Modo de vista">
                  <button
                    className={view === "top" ? "active" : ""}
                    onClick={() => {
                      setView("top");
                      setTool("move");
                    }}
                  >
                    Cenital
                  </button>
                  <button
                    className={view === "perspective" ? "active" : ""}
                    onClick={() => {
                      setView("perspective");
                      setTool("move");
                    }}
                  >
                    Perspectiva
                  </button>
                </div>
                <button
                  className="button subtle reset-view"
                  onClick={() => scene.current?.reset()}
                >
                  <RotateCw size={14} />
                  Restablecer vista
                </button>
              </div>
              {selected &&
                item &&
                !item.locked &&
                !item.hidden &&
                view === "top" && (
                  <div
                    className="transform-toolbar"
                    aria-label="Herramientas de transformación"
                  >
                    {(
                      [
                        ["move", "Mover", Move],
                        ["rotate", "Girar", RotateCw],
                        ["scale", "Escalar", Maximize2],
                      ] as const
                    ).map(([t, l, I]) => (
                      <IconButton
                        key={t}
                        label={l}
                        active={tool === t}
                        onClick={() => setTool(t)}
                      >
                        <I size={17} />
                      </IconButton>
                    ))}
                  </div>
                )}
              {!project.items.length && (
                <div className="canvas-onboarding">
                  <span>1. Elige vajilla</span>
                  <ChevronRight size={13} />
                  <span>2. Añade ingredientes</span>
                  <ChevronRight size={13} />
                  <span>3. Compón</span>
                </div>
              )}
              <div className="canvas-bottom">
                {view === "perspective" && (
                  <div className="angle-controls">
                    <label>
                      Giro <output>{az}°</output>
                      <input
                        aria-label="Giro de cámara"
                        type="range"
                        min="-180"
                        max="180"
                        value={az}
                        onChange={(e) =>
                          scene.current?.angles(Number(e.target.value), inc)
                        }
                      />
                    </label>
                    <label>
                      Inclinación <output>{inc}°</output>
                      <input
                        aria-label="Inclinación de cámara"
                        type="range"
                        min="10"
                        max="74"
                        value={inc}
                        onChange={(e) =>
                          scene.current?.angles(az, Number(e.target.value))
                        }
                      />
                    </label>
                  </div>
                )}
                <div className="view-controls">
                  <label>
                    <span>Guías</span>
                    <select
                      aria-label="Guía de composición"
                      value={guide}
                      onChange={(e) => setGuide(e.target.value)}
                    >
                      {guides.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="control-divider" />
                  <div className="zoom-controls">
                    <IconButton
                      label="Alejar"
                      onClick={() => scene.current?.zoom(-0.1)}
                    >
                      <Minus size={15} />
                    </IconButton>
                    <output>{zoom} %</output>
                    <IconButton
                      label="Acercar"
                      onClick={() => scene.current?.zoom(0.1)}
                    >
                      <Plus size={15} />
                    </IconButton>
                  </div>
                  <button
                    className="fit-button"
                    onClick={() => scene.current?.fit()}
                  >
                    <Maximize2 size={14} />
                    <span>Encuadrar plato</span>
                  </button>
                </div>
              </div>
              <div className="canvas-hint">
                {view === "perspective"
                  ? "Arrastra el fondo para girar la vista"
                  : selected
                    ? "Esquinas: escala · Lados: estira · Mayús: libre"
                    : "Selecciona un ingrediente para ajustarlo"}
              </div>
            </main>
            <aside className="inspector" aria-label="Propiedades y capas">
              <div className="inspector-scroll">
                <div className="panel-title">
                  <h2>Propiedades</h2>
                  <SlidersHorizontal size={16} />
                </div>
                {item ? (
                  <>
                    <div className="selected-name">
                      <Food kind={item.kind} color={item.color} size={34} />
                      <strong>{item.name}</strong>
                      {item.locked && <LockKeyhole size={14} />}
                    </div>
                    {item.locked && (
                      <p className="locked-note">
                        Desbloquea el elemento para editarlo.
                      </p>
                    )}
                    <div className="properties">
                      <NumberField
                        label="Ancho"
                        value={item.width}
                        min={2}
                        max={300}
                        unit="mm"
                        disabled={item.locked}
                        onCommit={(v) =>
                          patchItem(item.id, {
                            width: v,
                            depth: itemDepth(item),
                          })
                        }
                      />
                      <NumberField
                        label="Fondo"
                        value={itemDepth(item)}
                        min={2}
                        max={300}
                        unit="mm"
                        disabled={item.locked}
                        onCommit={(v) => patchItem(item.id, { depth: v })}
                      />
                      <NumberField
                        label="Rotación"
                        value={item.rotation}
                        min={-360}
                        max={360}
                        unit="°"
                        disabled={item.locked}
                        onCommit={(v) => patchItem(item.id, { rotation: v })}
                      />
                      <NumberField
                        label="Grosor"
                        value={item.thickness}
                        min={0.2}
                        max={120}
                        step={0.5}
                        unit="mm"
                        disabled={item.locked}
                        onCommit={(v) => patchItem(item.id, { thickness: v })}
                      />
                      <label className="color-property">
                        <span>Color del material principal</span>
                        <div>
                          <input
                            type="color"
                            aria-label="Color del ingrediente"
                            value={item.color}
                            disabled={item.locked}
                            onChange={(e) =>
                              patchItem(item.id, { color: e.target.value })
                            }
                          />
                          <span>{item.color.toUpperCase()}</span>
                        </div>
                      </label>
                    </div>
                    <button
                      className="advanced-toggle"
                      onClick={() => setAdvanced(!advanced)}
                      aria-expanded={advanced}
                    >
                      {advanced ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}{" "}
                      Más ajustes
                    </button>
                    {advanced && (
                      <div className="advanced-fields">
                        <NumberField
                          label="Elevación"
                          value={item.elevation}
                          min={0}
                          max={200}
                          unit="mm"
                          disabled={item.locked}
                          onCommit={(v) => patchItem(item.id, { elevation: v })}
                        />
                        <NumberField
                          label="Posición horizontal"
                          value={item.x}
                          min={-220}
                          max={220}
                          unit="mm"
                          disabled={item.locked}
                          onCommit={(v) => patchItem(item.id, { x: v })}
                        />
                        <NumberField
                          label="Posición vertical en el plato"
                          value={item.z}
                          min={-220}
                          max={220}
                          unit="mm"
                          disabled={item.locked}
                          onCommit={(v) => patchItem(item.id, { z: v })}
                        />
                        <label className="opacity-field">
                          Opacidad{" "}
                          <output>{Math.round(item.opacity * 100)} %</output>
                          <input
                            aria-label="Opacidad"
                            type="range"
                            min="10"
                            max="100"
                            value={item.opacity * 100}
                            disabled={item.locked}
                            onChange={(e) =>
                              patchItem(item.id, {
                                opacity: Number(e.target.value) / 100,
                              })
                            }
                          />
                        </label>
                        <button
                          className="button secondary full-width"
                          disabled={item.locked}
                          onClick={() =>
                            patchItem(item.id, { flip: !item.flip })
                          }
                        >
                          <FlipHorizontal2 size={15} />
                          Reflejar elemento
                        </button>
                      </div>
                    )}
                    <div className="item-actions">
                      <button onClick={duplicateItem}>
                        <Copy size={14} />
                        Duplicar
                      </button>
                      <button
                        className="danger"
                        disabled={item.locked}
                        onClick={remove}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="inspector-empty">
                    <MousePointer2 size={24} />
                    <p>
                      Selecciona un ingrediente del plato para ajustar sus
                      propiedades.
                    </p>
                  </div>
                )}
                {item && (
                  <div
                    className="layer-order-controls"
                    aria-label="Orden de superposición"
                  >
                    <span>Orden en el plato</span>
                    <button
                      title="Traer al frente"
                      onClick={() =>
                        commit((p) =>
                          reorderLayer(p, item.id, p.items.length - 1),
                        )
                      }
                    >
                      <ChevronsUp size={14} />
                      Al frente
                    </button>
                    <button
                      title="Enviar al fondo"
                      onClick={() => commit((p) => reorderLayer(p, item.id, 0))}
                    >
                      <ChevronsDown size={14} />
                      Al fondo
                    </button>
                    <button
                      title="Subir una capa"
                      onClick={() =>
                        commit((p) =>
                          reorderLayer(
                            p,
                            item.id,
                            p.items.findIndex((i) => i.id === item.id) + 1,
                          ),
                        )
                      }
                    >
                      <ArrowUp size={14} />
                      Subir
                    </button>
                    <button
                      title="Bajar una capa"
                      onClick={() =>
                        commit((p) =>
                          reorderLayer(
                            p,
                            item.id,
                            p.items.findIndex((i) => i.id === item.id) - 1,
                          ),
                        )
                      }
                    >
                      <ArrowDown size={14} />
                      Bajar
                    </button>
                  </div>
                )}
                <section className="layers">
                  <div className="panel-title">
                    <h2>Capas</h2>
                    <span className="count">{project.items.length}</span>
                  </div>
                  {!project.items.length ? (
                    <p className="panel-caption">
                      Aquí aparecerán los elementos de tu composición.
                    </p>
                  ) : (
                    <>
                      {[...project.items].reverse().map((i) => (
                        <div
                          className={`layer ${selected === i.id ? "selected" : ""} ${i.hidden ? "hidden-layer" : ""}`}
                          key={i.id}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData(
                              "application/mise-layer",
                              i.id,
                            )
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData(
                              "application/mise-layer",
                            );
                            if (id && id !== i.id)
                              commit((p) => {
                                return reorderLayer(
                                  p,
                                  id,
                                  p.items.findIndex((t) => t.id === i.id),
                                );
                              });
                          }}
                        >
                          <button
                            className="layer-select"
                            onClick={() => setSelected(i.id)}
                            aria-label={`Seleccionar ${i.name}`}
                          >
                            <GripVertical size={12} />
                            <span>{i.name}</span>
                          </button>
                          <IconButton
                            label={`${i.hidden ? "Mostrar" : "Ocultar"} ${i.name}`}
                            onClick={() =>
                              patchItem(i.id, { hidden: !i.hidden })
                            }
                          >
                            {i.hidden ? (
                              <EyeOff size={13} />
                            ) : (
                              <Eye size={13} />
                            )}
                          </IconButton>
                          <IconButton
                            label={`${i.locked ? "Desbloquear" : "Bloquear"} ${i.name}`}
                            onClick={() =>
                              patchItem(i.id, { locked: !i.locked })
                            }
                          >
                            {i.locked ? (
                              <LockKeyhole size={13} />
                            ) : (
                              <UnlockKeyhole size={13} />
                            )}
                          </IconButton>
                        </div>
                      ))}
                      <p className="layer-note">
                        La capa superior se coloca por encima de las que se
                        solapan. Arrastra para cambiar el orden.
                      </p>
                    </>
                  )}
                </section>
                <button className="backup-button" onClick={exportBackup}>
                  <FileDown size={15} />
                  Descargar copia editable
                </button>
              </div>
            </aside>
            {drawer && (
              <aside className="guide-drawer" aria-label="Guía contextual">
                <div className="drawer-heading">
                  <h2>Guía de emplatado</h2>
                  <IconButton
                    label="Cerrar guía"
                    onClick={() => setDrawer(null)}
                  >
                    <X size={19} />
                  </IconButton>
                </div>
                <div className="segmented drawer-tabs">
                  <button
                    className={drawer === "composition" ? "active" : ""}
                    onClick={() => setDrawer("composition")}
                  >
                    Composición
                  </button>
                  <button
                    className={drawer === "color" ? "active" : ""}
                    onClick={() => setDrawer("color")}
                  >
                    Color
                  </button>
                </div>
                <div className="drawer-scroll">
                  {drawer === "color" ? (
                    colorContent
                  ) : (
                    <>
                      <h3>
                        {guides.find((g) => g.id === guide)?.name === "Ocultas"
                          ? "Patrones de composición"
                          : guides.find((g) => g.id === guide)?.name}
                      </h3>
                      <p>
                        {guides.find((g) => g.id === guide)?.description ||
                          "Elige una referencia para explorar el equilibrio, el ritmo y el espacio negativo de tu plato."}
                      </p>
                      <GuideDiagram
                        kind={guide === "none" ? "triangular" : guide}
                      />
                      <label className="switch-label">
                        <span>
                          {guide === "none"
                            ? "Mostrar guía triangular"
                            : "Guía " +
                              guides
                                .find((g) => g.id === guide)
                                ?.name.toLowerCase()}
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={guide !== "none"}
                          onChange={(e) =>
                            setGuide(e.target.checked ? "triangular" : "none")
                          }
                        />
                      </label>
                      <p className="caption">
                        La retícula orienta la composición; no desplaza ni
                        reorganiza los ingredientes.
                      </p>
                      <h4>Los ocho patrones</h4>
                      <div className="guide-choices">
                        {guides
                          .filter((g) => g.id !== "none")
                          .map((g) => (
                            <button
                              key={g.id}
                              className={guide === g.id ? "active" : ""}
                              onClick={() => setGuide(g.id)}
                            >
                              {g.name}
                              {guide === g.id && <Check size={14} />}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
      {(page === "guide" || page === "help") && (
        <main className="page-shell learning-page">
          <div className="learning-heading">
            <span className="small-label">
              {page === "guide" ? "Componer con criterio" : "A tu ritmo"}
            </span>
            <h1>
              {page === "guide"
                ? "Guía de emplatado"
                : "¿Cómo utilizo Mise en Place?"}
            </h1>
            <p>
              {page === "guide"
                ? "Referencias para explorar las relaciones entre forma, color y espacio."
                : "Lo que necesitas para pasar de una idea a una composición."}
            </p>
          </div>
          {page === "guide" ? (
            <div className="guide-page-grid">
              <section className="pattern-grid">
                {guides
                  .filter((g) => g.id !== "none")
                  .map((g) => (
                    <article key={g.id}>
                      <GuideDiagram kind={g.id} />
                      <h2>{g.name}</h2>
                      <p>{g.description}</p>
                      {project && (
                        <button
                          className="text-button"
                          onClick={() => {
                            setGuide(g.id);
                            setPage("editor");
                          }}
                        >
                          Aplicar guía <ArrowRight size={14} />
                        </button>
                      )}
                    </article>
                  ))}
              </section>
              <aside className="color-page">{colorContent}</aside>
            </div>
          ) : (
            <div className="help-layout">
              <nav aria-label="Temas de ayuda">
                {HELP.map(([s], i) => (
                  <button
                    key={s}
                    className={helpTopic === i ? "active" : ""}
                    onClick={() => setHelpTopic(i)}
                  >
                    {s}
                  </button>
                ))}
              </nav>
              <article className="help-content">{helpContent}</article>
            </div>
          )}
        </main>
      )}
      <input
        type="file"
        accept=".json,application/json"
        className="visually-hidden"
        ref={importRef}
        aria-label="Importar copia editable"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importProject(f);
          e.target.value = "";
        }}
      />
      {dialog === "rename" && (
        <Modal title="Nombre del emplatado" onClose={() => setDialog(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmRename();
            }}
          >
            <label className="form-field">
              Nombre
              <input
                autoFocus
                value={nameDraft}
                maxLength={100}
                onChange={(e) => {
                  setNameDraft(e.target.value);
                  setRenameError("");
                }}
              />
            </label>
            {renameError && (
              <p className="error-message" role="alert">
                {renameError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setDialog(null)}
              >
                Cancelar
              </button>
              <button className="button primary" type="submit">
                Confirmar nombre
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === "leave" && (
        <Modal
          title="Tienes cambios sin guardar"
          onClose={() => setDialog(null)}
        >
          <p>¿Qué quieres hacer antes de volver a Mis emplatados?</p>
          <div className="leave-options">
            <button
              className="button primary"
              disabled={saveState === "saving"}
              onClick={async () => {
                if (await store()) {
                  setDialog(null);
                  setHistory([]);
                  setCursor(0);
                  setSaved("");
                  setPage(nextPage.current);
                }
              }}
            >
              {saveState === "saving" ? "Guardando…" : "Guardar y salir"}
            </button>
            <button
              className="button secondary"
              onClick={() => setDialog(null)}
            >
              Seguir editando
            </button>
          </div>
          {saveState === "error" && (
            <p role="alert" className="error-message">
              No se ha podido guardar. El proyecto sigue abierto.
            </p>
          )}
          <button
            className="text-button danger discard"
            onClick={() => {
              setDialog(null);
              setHistory([]);
              setCursor(0);
              setSaved("");
              setPage(nextPage.current);
            }}
          >
            Salir sin guardar
          </button>
        </Modal>
      )}
      {dialog === "deleteProject" && targetProject && (
        <Modal title="Eliminar emplatado" onClose={() => setDialog(null)}>
          <p>
            Se eliminará «{targetProject.name}» de este navegador. Esta acción
            no se puede deshacer.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDialog(null)}
            >
              Cancelar
            </button>
            <button
              className="button danger-button"
              onClick={() => {
                try {
                  const list = readProjects().filter(
                    (p) => p.id !== targetProject.id,
                  );
                  writeProjects(list);
                  setProjects(list);
                  if (project?.id === targetProject.id) {
                    setHistory([]);
                    setSaved("");
                  }
                  setDialog(null);
                  notify("Emplatado eliminado.");
                } catch {
                  notify("No se ha podido eliminar el emplatado.", true);
                }
              }}
            >
              Eliminar emplatado
            </button>
          </div>
        </Modal>
      )}
      {dialog === "export" && project && (
        <Modal
          title="Exportar emplatado"
          onClose={() => {
            if (!exporting) setDialog(null);
          }}
          wide
        >
          <div className="segmented export-tabs">
            <button
              className={format === "pdf" ? "active" : ""}
              onClick={() => setFormat("pdf")}
            >
              Ficha técnica PDF
            </button>
            <button
              className={format === "png" ? "active" : ""}
              onClick={() => setFormat("png")}
            >
              Imagen PNG
            </button>
          </div>
          <div className="export-layout">
            <section className="export-options">
              <div className="export-project-name">
                <span>Nombre del emplatado</span>
                <strong>{project.name}</strong>
              </div>
              <fieldset>
                <legend>Vista de la composición</legend>
                <label>
                  <input
                    type="radio"
                    name="exportView"
                    checked={exportView === "top"}
                    onChange={() => setExportView("top")}
                  />
                  Vista cenital
                </label>
                <label>
                  <input
                    type="radio"
                    name="exportView"
                    checked={exportView === "current"}
                    onChange={() => setExportView("current")}
                  />
                  Vista actual
                </label>
              </fieldset>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={includeGuides}
                  onChange={(e) => setIncludeGuides(e.target.checked)}
                />
                Incluir guías de composición
              </label>
              {format === "pdf" ? (
                <>
                  <p className="export-elements">
                    <strong>Elementos</strong>
                    {project.items
                      .filter((i) => !i.hidden)
                      .map((i) => i.name)
                      .join(" · ") || "Sin ingredientes"}
                  </p>
                  <label className="form-field">
                    Notas de montaje (opcional)
                    <textarea
                      value={exportNotes}
                      maxLength={10000}
                      onChange={(e) => setExportNotes(e.target.value)}
                      placeholder="Escribe una indicación para el montaje…"
                      rows={4}
                    />
                  </label>
                </>
              ) : (
                <div className="local-note">
                  <p>
                    La imagen contendrá el emplatado, sin los controles de
                    edición.
                  </p>
                </div>
              )}
              <p className="caption">
                Exportar no sustituye a guardar el proyecto editable.
              </p>
            </section>
            <section className="export-preview">
              <h3>
                Vista previa · {format === "pdf" ? "Ficha PDF" : "Imagen PNG"}
              </h3>
              <div className={format === "pdf" ? "pdf-sheet" : "png-sheet"}>
                {format === "pdf" && <h4>{project.name}</h4>}
                {!paintReady && (
                  <p role="status">Preparando los materiales ilustrados…</p>
                )}
                {preview && (
                  <img
                    src={preview}
                    alt="Vista previa exacta del emplatado a exportar"
                  />
                )}
                {format === "pdf" && (
                  <>
                    <strong>Elementos</strong>
                    <p>
                      {project.items
                        .filter((i) => !i.hidden)
                        .map((i) => i.name)
                        .join(" · ") || "Sin ingredientes"}
                    </p>
                    {exportNotes && (
                      <p className="preview-notes">{exportNotes}</p>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
          {exportError && (
            <p className="error-message" role="alert">
              {exportError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDialog(null)}
              disabled={exporting}
            >
              Cancelar
            </button>
            <button
              className="button primary"
              onClick={() => void exportFile()}
              disabled={exporting || !preview}
            >
              {exporting ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Download size={16} />
              )}{" "}
              {exporting ? "Generando…" : `Descargar ${format.toUpperCase()}`}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "toast-error" : ""}`}
          role="status"
        >
          {toast.error ? <AlertCircle size={18} /> : <CircleCheck size={18} />}
          <span>{toast.message}</span>
          <button
            aria-label="Cerrar notificación"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function GuideDiagram({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    triangular: "M100 40 45 140 155 140Z",
    symmetric: "M100 25V175 M25 100H175",
    asymmetric: "M50 50Q10 100 60 150 M135 45Q180 65 150 100",
    rhythmic: "M35 130Q70 30 100 100T170 70",
    diagonal: "M40 150 160 50 M50 165 175 65",
    scale: "M35 130 165 60",
    horizontal: "M25 80H175 M25 120H175",
    structured: "M65 30V170 M135 30V170 M30 65H170 M30 135H170",
  };
  return (
    <svg
      viewBox="0 0 200 200"
      className="guide-diagram"
      role="img"
      aria-label={`Diagrama de composición ${kind}`}
    >
      <circle
        cx="100"
        cy="100"
        r="86"
        fill="#fffcf6"
        stroke="#d8d0c0"
        strokeWidth="2"
      />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#d8d0c0" />
      <path
        d={paths[kind] || paths.triangular}
        fill="none"
        stroke="#b8431f"
        strokeDasharray="4 4"
        strokeWidth="1.5"
      />
      {kind === "scale" &&
        [0, 1, 2, 3].map((n) => (
          <circle
            key={n}
            cx={42 + n * 36}
            cy={125 - n * 18}
            r={5 + n * 4}
            fill="#d8cce3"
            stroke="#857c6c"
          />
        ))}
    </svg>
  );
}
