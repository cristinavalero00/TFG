# Mise en Place

**Diseña tus emplatados.** Aplicación web para escritorio, con composición 3D ilustrada y guardado manual local.

## Descargar la aplicación preparada

Descarga [Mise-en-Place.zip](entrega/Mise-en-Place.zip) desde la carpeta `entrega/` y descomprímelo. El paquete incluye la aplicación compilada y el código fuente. Sigue `LEEME-APLICACION.txt` para abrirla; necesitas Node.js LTS y un navegador con WebGL.

## Abrir en tu ordenador

Necesitas Node.js LTS (22.12 o posterior) y un navegador de escritorio con WebGL. No necesitas cuentas, claves ni servicios externos.

Desde esta carpeta:

```sh
npm ci
npm run build
node iniciar.mjs
```

El servidor indica la dirección que debes abrir. Mantén la terminal abierta mientras utilizas la aplicación. Para detenerla, pulsa Ctrl+C.

En el paquete que incluye `dist/`, la aplicación ya está compilada: basta `node iniciar.mjs`. Los archivos `Iniciar Mise en Place.bat` (Windows) y `Iniciar Mise en Place.command` (macOS) facilitan el inicio cuando Node está instalado. En macOS, si no permite abrir el `.command`, ejecuta el comando desde Terminal. No abras `dist/index.html` directamente como archivo.

## Desarrollo

```sh
npm ci
npm run dev
```

Comprobaciones:

```sh
npm test
npm run build
```

Prueba funcional de navegador, con Python Playwright y Chromium instalados, contra el servidor de desarrollo o el compilado:

```sh
python tests/browser.py
```

Admite `MISE_URL` y `CHROMIUM_PATH`. Los resultados y capturas se generan en `test-results/` (ignorado por Git).

## Funciones

- Inicio vacío, galería de composiciones y ejemplo opcional que no se guarda sin tu acción.
- Crear, renombrar, duplicar, abrir y eliminar proyectos con confirmación.
- Cuatro vajillas: redonda, honda, rectangular y pizarra; color configurable.
- Biblioteca inicial de 17 ingredientes, guarniciones, decoración, salsas y formas. Formas tridimensionales procedurales con acabado ilustrado.
- Añadir por clic o arrastre. Selección sincronizada entre lienzo, inspector y capas.
- Mover, rotar, escalar, reflejar, duplicar y eliminar elementos. Ancho y fondo independientes, grosor, color principal, opacidad y elevación editables. Ocho tiradores: esquinas proporcionales y lados independientes; Mayús permite proporción libre.
- Modos de transformación con gizmos en cenital y campos numéricos en ambas vistas.
- Ocultar, bloquear y organizar la lista de capas. Al reordenarlas cambia la superposición de los elementos que se solapan, mediante apilado geométrico. También hay controles para subir, bajar, traer al frente y enviar al fondo. La elevación manual se conserva como separación adicional.
- Cámara cenital y oblicua sobre la misma escena. Giro, inclinación, zoom, encuadre y restablecimiento de vista.
- Ocho guías de composición y consulta contextual de teoría del color. La paleta del plato se calcula a partir de los materiales principales de los elementos visibles, con análogos y complementarios según el color elegido. No analiza píxeles de texturas ni iluminación.
- Deshacer/rehacer hasta 100 acciones. Un arrastre equivale a una acción.
- Guardado manual en el navegador, advertencia al salir y estados reales de error.
- Exportación PNG a 1000 × 1000 px y ficha PDF A4 con listado de elementos visibles y notas; paginación de notas largas.
- Exportación cenital o de cámara actual, con guías opcionales y sin controles/selección.
- Copia editable JSON e importación validada para trasladar un proyecto a otro navegador.
- Ayuda y atajos de teclado. Fuentes locales DM Serif Display y Public Sans.

## Conservación de proyectos

El guardado usa `localStorage`, con la clave `mise-en-place.projects.v1`. Depende del navegador y del **origen exacto** (protocolo, dirección y puerto). Abrir desde otra dirección no comparte los proyectos. No sincroniza dispositivos. Borrar datos del navegador elimina el almacenamiento local. El modo privado o una cuota agotada pueden impedir guardar.

Descarga una copia editable para conservar los datos transportables. Un PNG o PDF no permite recuperar los objetos editables. Los datos corruptos no se sustituyen silenciosamente por una lista vacía; la aplicación informa del error.

## Alcance y límites

Aplicación web orientada a ordenador, no instalador nativo. No tiene backend ni autenticación. El editor necesita WebGL; en pantallas pequeñas conserva un espacio mínimo de trabajo y requiere desplazamiento horizontal. El prototipo no simula colisiones, gravedad, preparación culinaria ni apilado físico automático. La elevación se ajusta manualmente. La biblioteca es inicial, no un catálogo exhaustivo. Las salsas son formas parametrizables, no un pincel de dibujo libre.

Las dimensiones utilizan una escala convencional en milímetros; no certifican medidas culinarias de alimentos reales. Las guías son referencias visuales y no recolocan objetos ni puntúan composiciones. El PDF lista solo los elementos visibles. La pérdida de cambios no guardados tras un cierre inesperado no se puede impedir de forma absoluta.

La aplicación y las pruebas de integración se verifican en Chromium. No se afirma validación con usuarios ni compatibilidad probada en Safari o Firefox. Se respeta reducción de movimiento y hay alternativas numéricas al arrastre; no constituye una auditoría completa de accesibilidad.

## Estructura

- `src/App.tsx`: pantallas, estados e interacciones.
- `src/Scene.tsx`: modelos procedurales, cámara, selección, arrastre y captura 3D.
- `src/model.ts`: tipos, biblioteca, validación y almacenamiento.
- `src/Illustration.tsx`: miniaturas ilustradas.
- `src/style.css`: sistema visual y distribución.
- `tests/`: comprobaciones de datos y recorridos reales de navegador.
- `iniciar.mjs`: servidor local sin dependencias para `dist/`.

## Licencias de dependencias

React, Three.js, Vite, jsPDF y Lucide se distribuyen con sus respectivas licencias de código abierto. DM Serif Display y Public Sans se incluyen a través de Fontsource; conserva los archivos de licencia de esos paquetes al redistribuir sus fuentes. Los volúmenes y las miniaturas se construyen en el código del proyecto. Un atlas original de materiales ilustrados, generado con OpenAI ImageGen para esta aplicación, se utiliza en las superficies y las miniaturas. No se han copiado las imágenes de referencia aportadas por la usuaria.

## Cambios de la versión 1.1

- Ocho tiradores sobre el marco de la selección. El anclaje opuesto se conserva al estirar y una operación se puede cancelar con Escape.
- Campo Fondo independiente. Los proyectos antiguos sin este dato siguen abriéndose; no se cambia la clave de almacenamiento.
- Orden real de superposición mediante apilado de los elementos que se solapan. Los proyectos anteriores mantienen su disposición hasta utilizar los controles de orden.
- Análisis cromático local de los colores principales de ingredientes visibles. Las sugerencias no se aplican automáticamente.
- Materiales ilustrados con mayor detalle, aplicados a los volúmenes y a las miniaturas.
- Pruebas adicionales: `node --import tsx tests/interactions.test.ts` y `python tests/corrections.py`.

## Cambios de la versión 1.1.1

Las salsas y formas utilizan un segundo atlas original de texturas ilustradas, generado con OpenAI ImageGen. Sus materiales neutros se tiñen con el color elegido por la persona usuaria. Puntos, trazos, bases, líneas y círculos presentan variaciones de pigmento y contornos suavemente irregulares. La biblioteca, la escena y la exportación mantienen este acabado. Comprobación específica: `python tests/sauces.py`.
