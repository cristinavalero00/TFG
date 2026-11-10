import { useState } from "react";
import type { Item, Project } from "./model";
import { harmonies, hexToHsl, hueDistance, platePalette } from "./composition";
export function ColorAnalysis({
  project,
  selected,
}: {
  project?: Project;
  selected?: Item;
}) {
  const [base, setBase] = useState<string | null>(null);
  const palette = platePalette(project?.items ?? []);
  const chosen =
    palette.find((p) => p.color === base) ||
    palette.find((p) => p.color === selected?.color.toLowerCase()) ||
    palette[0];
  const reference = chosen?.color ?? "#d97138";
  const harmony = harmonies(reference),
    hue = hexToHsl(reference).h;
  const matches = (hex: string) =>
    palette
      .filter(
        (p) =>
          p.color !== reference &&
          hexToHsl(p.color).s >= 0.12 &&
          hueDistance(hexToHsl(p.color).h, hexToHsl(hex).h) <= 18,
      )
      .flatMap((p) => p.names);
  return (
    <div className="color-guide">
      <h3>
        {palette.length
          ? "Los colores de tu emplatado"
          : "Relaciones cromáticas"}
      </h3>
      <p>
        {palette.length
          ? "Selecciona un color del plato para explorar sus tonos análogos y su complementario. Las propuestas se actualizan al editar los ingredientes."
          : "Añade ingredientes para ver sus colores y las armonías correspondientes. A continuación se muestra un ejemplo didáctico."}
      </p>
      {palette.length > 0 && (
        <>
          <h4>Paleta de ingredientes visibles</h4>
          <div className="plate-palette">
            {palette.map((p) => (
              <button
                key={p.color}
                className={p.color === reference ? "selected" : ""}
                onClick={() => setBase(p.color)}
                aria-label={`Usar color de ${p.names.join(", ")}`}
                aria-pressed={p.color === reference}
              >
                <span style={{ background: p.color }} />
                <strong>{p.names.join(", ")}</strong>
                <small>{p.color.toUpperCase()}</small>
              </button>
            ))}
          </div>
        </>
      )}
      <div
        className="color-wheel"
        role="img"
        aria-label={`Color de referencia ${reference}`}
      >
        <span />
        <i className="hue-marker" style={{ transform: `rotate(${hue}deg)` }} />
      </div>
      <div className="reference-color">
        <span style={{ background: reference }} />
        <div>
          <strong>Color de referencia</strong>
          <small>
            {reference.toUpperCase()}
            {chosen ? " · " + chosen.names.join(", ") : " · ejemplo"}
          </small>
        </div>
      </div>
      {harmony.neutral ? (
        <p className="local-note">
          Este color es neutro o poco saturado. Elige otro color de la paleta
          para comparar relaciones de tono.
        </p>
      ) : (
        <>
          <h4>Análogos del color seleccionado</h4>
          <p>Tonos cercanos en la rueda: −30°, referencia y +30°.</p>
          <div className="harmony-swatches">
            {harmony.analogous.map((c, n) => (
              <div key={n}>
                <span style={{ background: c }} />
                <code>{c.toUpperCase()}</code>
                <small>
                  {n === 1
                    ? "Referencia"
                    : matches(c).length
                      ? "Presente: " + matches(c).join(", ")
                      : "Para explorar"}
                </small>
              </div>
            ))}
          </div>
          <h4>Complementario del color seleccionado</h4>
          <p>El tono opuesto, a 180° de la referencia.</p>
          <div className="harmony-swatches">
            <div>
              <span style={{ background: harmony.complementary }} />
              <code>{harmony.complementary.toUpperCase()}</code>
              <small>
                {matches(harmony.complementary).length
                  ? "Presente: " + matches(harmony.complementary).join(", ")
                  : "Para explorar"}
              </small>
            </div>
          </div>
        </>
      )}
      <p className="caption">
        Análisis local del material principal de los ingredientes visibles. No
        extrae los colores de las texturas o la iluminación, no incluye la
        vajilla y no modifica tu composición.
      </p>
    </div>
  );
}
