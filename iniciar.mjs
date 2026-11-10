// Servidor local sin dependencias para la versión compilada.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
try {
  await stat(path.join(root, "index.html"));
} catch {
  console.error(
    "Falta la versión compilada. Ejecuta npm ci y npm run build antes de iniciar.",
  );
  process.exit(1);
}
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".json": "application/json",
};
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    const decoded = decodeURIComponent(url.pathname);
    const file = path.resolve(root, "." + decoded);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      return res.end("Acceso no permitido");
    }
    let target = file;
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = path.join(target, "index.html");
    } catch {
      target = path.join(root, "index.html");
    }
    const data = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Archivo no encontrado");
  }
});
server.on("error", (e) => {
  console.error("No se ha podido iniciar la aplicación:", e.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Mise en Place está disponible en http://127.0.0.1:${port}`);
  console.log(
    "Abre esa dirección en tu navegador. Mantén esta ventana abierta. Ctrl+C para cerrar.",
  );
});
