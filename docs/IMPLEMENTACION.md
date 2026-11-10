# Implementación de Mise en Place

10 de noviembre de 2026.

## Base acordada

Aplicación web de escritorio para diseño de emplatados, basada en los mockups High-Fi v2 (con corrección de encuadre de exportación), los wireframes Low-Fi v3 y la guía de estilos v4. Nombre: Mise en Place. Lema: Diseña tus emplatados.

El repositorio estaba vacío al comenzar esta implementación. No se ha sustituido código anterior. Las pantallas y modelos son implementación propia; los PDF de referencia no se incluyen como recursos del producto.

## Decisiones

- React y TypeScript para las pantallas; Three.js para la escena tridimensional. Los modelos se construyen mediante geometrías y materiales, no mediante fotografías ni imágenes planas que simulan el giro.
- Cámara ortográfica cenital y oblicua para mantener una lectura espacial comparable. El modo denominado Perspectiva en la interfaz permite giro e inclinación del punto de observación.
- Dimensiones convencionales en milímetros sobre vajillas de 260–300 mm. Se trata de una herramienta de planificación, no de una medición del alimento físico.
- Biblioteca inicial de 17 recursos. Las salsas son formas transformables. El dibujo libre no forma parte del alcance definido de herramientas.
- El color modifica el material principal; semillas, pieles u otros detalles pueden conservar colores propios.
- Desde la versión 1.1, el orden de capas modifica la superposición: se calcula la base geométrica de cada elemento sobre las capas inferiores con las que se solapa. Grosor y elevación manual siguen siendo propiedades separadas. No se simulan gravedad ni colisiones físicas. Los proyectos previos conservan su disposición hasta modificar el orden.
- Guardado manual local confirmado por Cristina. No se requieren cuentas, claves, servicios remotos ni base de datos en servidor.
- Copia editable JSON e importación para conservar o trasladar proyectos. PNG/PDF son salidas visuales que no sustituyen a ese archivo editable.
- PNG de 1000 × 1000 px y PDF A4, con fuentes locales incorporadas. La captura omite selección y herramientas; permite activar retículas expresamente.
- Las notas largas se reparten en páginas adicionales del PDF. Solo se listan los elementos visibles.
- El contenido de las guías es una explicación breve de uso y composición. No sustituye a la investigación académica, no atribuye resultados a encuestas y no puntúa emplatados.

## Validación

- Compilación TypeScript y Vite.
- Seis pruebas de datos: conservación de composición, errores de cuota, detección de datos corruptos, independencia de instancias, validación de geometrías y huella de cambios editables.
- Recorridos funcionales en Chromium: creación, modificación, deshacer/rehacer, validación numérica, arrastre real en el lienzo, cambio de cámara, guías y ayuda, bloqueo/visibilidad, exportación PDF/PNG, copia editable, almacenamiento fallido, protección de salida, reapertura después de recargar, duplicado, eliminación e importación.
- Comprobación adicional de cuatro vajillas, 17 recursos y ocho guías, y manipulación mediante gizmos de escala y rotación.
- Revisión visual de inicio y editor cenital/oblicuo. El código no requiere conexiones externas durante el uso normal tras cargar sus recursos.

Estas comprobaciones son técnicas. No se presentan como una evaluación de usabilidad con cocineros ni como una auditoría de accesibilidad. Safari y Firefox no se han validado en esta sesión.

## Continuidad

Utilizar el checkout existente en /workspace/TFG. No crear worktrees salvo solicitud del usuario. Consultar README.md para instalar, iniciar y probar. El proyecto contiene scripts de inicio para la versión compilada. Los procesos necesitan iniciarse de nuevo tras restaurar el entorno.

## Entrega local

El paquete de distribución reúne `dist/`, el servidor `iniciar.mjs`, archivos de inicio, fuentes y código editable. La versión compilada ha superado los recorridos principales en Chromium. Se ha comprobado además ausencia de desbordamiento horizontal del editor a 1280, 1440 y 1920 px de ancho. La prueba de almacenamiento incluye un fallo simulado de cuota y verifica que el proyecto siga abierto.

La configuración reutilizable del entorno tiene instrucciones de instalación y arranque guardadas como borrador. Guardarlas no publica la aplicación ni hace accesible el servidor local desde Internet.

## Correcciones solicitadas por Cristina · Versión 1.1

Se incorporan ocho tiradores en cenital, ancho y fondo independientes y escala proporcional por esquina. Mayús permite proporción libre. Los tiradores respetan la rotación y mantienen fija la posición opuesta. El orden de capas afecta ahora al plato, con alternativas por botones y arrastre. Las armonías se calculan a partir del color principal editable de ingredientes visibles, con una referencia elegida por la persona. No se extraen colores de los píxeles de las texturas ni de la iluminación.

El nuevo atlas de materiales es un recurso original generado con OpenAI ImageGen a partir de una descripción de acabado pictórico y gastronómico. Se mantiene la geometría tridimensional y la posibilidad de recolorear el material principal. Las miniaturas utilizan el mismo atlas. No se emplean recortes de las referencias de la usuaria.

La compatibilidad con datos anteriores se mantiene mediante campos opcionales y la misma clave de almacenamiento. Se verifican los datos antiguos sin fondo explícito ni modo de apilado.

Comprobación de la versión 1.1: 14 pruebas de datos e interacción geométrica superadas. Los recorridos de navegador verifican además los ocho tiradores, el ajuste de fondo en salsas, el anclaje de objetos girados, la cancelación con Escape, el cambio visible de superposición por botones y arrastre, las armonías actualizadas al cambiar de color y la apertura de proyectos anteriores. La compilación y los recorridos completos de guardado y exportación también se han ejecutado sobre la versión compilada, sin errores JavaScript.

## Acabado de las salsas (1.1.1)

El atlas `public/art/sauce-materials.png` contiene cuatro materiales originales en escala de grises: coulis, pincelada, crema y línea de salsa. Se aplica el color editable mediante multiplicación en la escena y transferencia de canales en las miniaturas. Las coordenadas de textura se proyectan sobre el plano del plato para conservar la lectura de las pinceladas. La geometría presenta pequeñas variaciones deterministas en el contorno y mantiene el ancho y el fondo configurables. Las capturas PNG y PDF utilizan los mismos materiales que la escena.
