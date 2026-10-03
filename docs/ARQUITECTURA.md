# Arquitectura

OSI Quest utiliza JavaScript con módulos ES, HTML semántico y CSS. DOMPurify se incluye localmente en el renderizador. esbuild compila la distribución y Playwright verifica recorridos en el navegador. Su separación de responsabilidades permite cambiar una pantalla o añadir preguntas sin modificar todo el proyecto.

## Flujo de una interacción

```text
Enlace o control de una pantalla
  → router o controlador de la función
  → sesión de dominio (si es un juego)
  → repositorio de progreso (si hay un resultado)
  → vista de la función
  → shell y contenido actualizados
```

`src/main.js` solo inicia la aplicación e instala controles y ayudas de automatización. `app/application.js` conecta navegación, persistencia y sesiones. `app/routes.js` resuelve las pantallas; no contiene sus reglas de juego ni su HTML.

## Límites entre módulos

| Carpeta      | Responsabilidad                          | Evita                                      |
| ------------ | ---------------------------------------- | ------------------------------------------ |
| `data`       | Contenido y metadatos declarativos       | Acceso al DOM o guardado                   |
| `domain`     | Reglas, sesiones, selección y calendario | Navegador, HTML y localStorage             |
| `services`   | Guardado, migración, copias y descargas  | Decidir la respuesta correcta              |
| `components` | Piezas reutilizables de interfaz         | Conocer el estado de cada reto             |
| `features`   | Vista y eventos de una actividad         | Reimplementar las reglas del dominio       |
| `app`        | Composición y navegación                 | Una gran plantilla con todas las pantallas |
| `styles`     | Presentación y adaptación a pantallas    | Reglas del aprendizaje                     |

Cada vista devuelve `{ section, title, html, bind? }`; `bind` puede devolver una función de limpieza para eventos externos a sus elementos. El renderer la ejecuta antes de sustituir la pantalla. Las vistas se cargan por `import()` y después quedan disponibles de forma síncrona; un contador de revisión descarta cargas obsoletas al navegar deprisa. El shell se monta una sola vez. Al cambiar de pantalla se reemplaza solo `main`; los eventos de la pantalla anterior se liberan con sus elementos. El estado temporal de la sesión reside en `app.activity`, mientras el progreso duradero pertenece al repositorio.

Las plantillas usan el tag `html` para que el editor pueda formatear el marcado. El tag escapa valores por defecto; los fragmentos de marcado propios se componen explícitamente con `raw`. Las copias importadas se validan y no pueden añadir HTML a las vistas.

## Añadir contenido

- Nueva pregunta: añádela al banco normal, difícil o de casos en `data/questions/`. Su `id` debe ser estable y único, `layer` entre 0 y 7 (0 para fundamentos), `correctIndex` válido y una explicación. `layerQuestion` indica si las opciones son nombres de capas.
- Nuevo caso: registra sus tres preguntas y referencias en `data/cases.js`.
- Lección: declara metadatos en `data/units.js` y su contenido estructurado en `data/lessons.js` o `data/practical-lessons.js`. Las lecciones de capas reutilizan `layers` y `stories`.
- Nueva actividad: registra sus metadatos en `data/activities.js`, la sesión en `features/play/session-factory.js` y su vista en `app/routes.js`.

Mantén los identificadores existentes para conservar las estadísticas. Ejecuta `npm run verify` al terminar.

## Actividades e interacción

`data/activities.js` registra las 15 actividades. `features/play/filters.js` agrupa sus tarjetas en manipular y conectar, reconocer y resolver, y recordar y repasar; filtrar no cambia las reglas ni la dificultad de una sesión.

- `domain/matching-session.js` elige una tarea por capa entre las 28 variantes de `data/matching.js`: dos ejemplos por cada capa y dificultad. Controla la selección en ambos sentidos, las conexiones, las pistas y los errores de cada tarea. `features/matching/` implementa selección y arrastre sin duplicar esas reglas.
- `domain/packet-session.js` controla las seis etapas declaradas en `data/packet-missions.js`: petición HTTP, puerto TCP, entrega fiable, IP de destino, MAC del siguiente salto y señales de Ethernet sobre cobre. La dificultad añade piezas trampa y retira el apoyo inicial. `features/packet/` representa la construcción progresiva y permite seleccionar o arrastrar una pieza antes de comprobarla.
- `app/accessibility.js` resuelve los atajos A–D para preguntas, Mayús+F y Esc para pantalla completa. Ignora campos de edición y diálogos. Los controles nativos permiten Tab y Enter; el foco se restaura después de actualizar una actividad.

El envío es un ejemplo explícito de HTTP sin TLS sobre TCP, IPv4 y Ethernet. Las seis etapas enseñan funciones seleccionadas de ese intercambio; no equivalen a seis capas OSI, no representan todos los campos ni ejecutan una comunicación real.

## Puntuación y repasos

- `domain/rewards.js` es la regla central que usan las sesiones, el repositorio y los indicadores de la interfaz: normal concede 8 XP por acierto independiente y 4 con ayuda; difícil concede 20 XP y 10 con ayuda. Una respuesta incorrecta concede 0 XP.
- `levelProgress()` calcula un nivel nuevo cada 200 XP, sin modificar ni recalcular la experiencia guardada de versiones anteriores.
- En orden, conexiones y construcción del envío, fallar un paso convierte su posterior acierto en asistido. Una pista también afecta solo a ese paso. Las capas conectadas y las etapas completadas no se pueden volver a puntuar en la misma ronda.
- En un examen, las respuestas son editables. El guardado y la puntuación se realizan al entregar. Una entrega repetida no vuelve a puntuar. Los huecos cuentan como errores.
- Los casos guiados usan dificultad normal. Las estadísticas de precisión por capa cuentan preguntas y exámenes; los retos de orden, conexiones y envío conservan sus resultados en el historial.
- Repaso de preguntas: 1, 3 y 7 días tras aciertos consecutivos; error o ayuda devuelve la pregunta a pendientes.
- Tarjetas: 1, 3, 7 y 14 días. «Todavía no» vuelve a pendientes. La autoevaluación no suma XP.
- El repaso adaptativo prioriza vencidas, nuevas y después futuras. Si no hay tarjetas pendientes, permite practicar las tarjetas antes de tiempo y lo indica.

## Dominio, insignias y nuevos modos

- `domain/activity-clock.js` recibe una función de tiempo inyectable. Acumula solo intervalos activos y se detiene una vez al completar la ronda. `app/activity-timers.js` conecta visibilidad, navegación, pausa, contador y vencimiento a las sesiones. El reloj de pregunta se detiene al responder; el de ronda incluye la lectura de explicaciones.
- `domain/survival-session.js` extiende las reglas de pregunta con tres vidas, un máximo de 20 preguntas y un límite opcional de 30 segundos. Vencer el plazo y responder se resuelven en el mismo dominio para evitar puntuar una respuesta tardía o perder dos vidas. El resultado cuenta solo preguntas contestadas, no el banco entero.
- `domain/duel-session.js` contiene dos sesiones independientes sobre el mismo banco y barajado. Sus fases explícitas son `handoff`, `question` y `reveal`. La primera respuesta no se representa antes del segundo turno. El controlador solo registra el resumen del duelo; nunca registra sus respuestas o XP en el perfil compartido.
- `data/misconceptions.js` declara seis conceptos con cuatro preguntas propias cada uno. `domain/concept-badges.js` exige dos identificadores de prueba distintos y sin ayuda; conserva la evidencia de la insignia ganada aunque aparezca un error posterior. Un error o pista reinicia las pruebas y fija diez minutos antes de admitir nueva evidencia. El esquema valida que las pruebas pertenecen al concepto.
- `domain/mastery.js` calcula precisión × cobertura de cuatro preguntas distintas. `features/progress/mastery-view.js` ofrece un radar SVG con equivalente textual de siete filas y filtros accesibles. Las estadísticas nuevas conservan el agregado y agregan contadores por dificultad; las anteriores no se reclasifican por deducción.
- `domain/round-report.js` calcula la media antes de guardar la nueva ronda, agrupa los resultados pendientes por capa y construye una instantánea con duración y configuración. `app.completeRound()` es idempotente; las vistas de resultados comparten `features/play/result-insights.js`.
- `domain/retry-options.js` obtiene los objetivos precisos desde los resultados. Las sesiones de orden, conexiones, envío y tarjetas aceptan subconjuntos. El envío completa las piezas anteriores como contexto sin crear nuevos resultados. El repaso de un duelo activa `practiceOnly`, que impide XP, estadísticas, insignias e historial personal.

El banco `questions` contiene 181 preguntas con los IDs anteriores conservados. `learningQuestions` añade 24 pruebas de conceptos y 21 decisiones de historia; `questionById` indexa las 226. La selección difícil respeta el tipo y cubre las capas. Las nuevas preguntas incluyen `whyChoices`, alineado con las alternativas, y `sources`. El nuevo banco/algoritmo utiliza una revisión de clase nueva.

El esquema de progreso sigue en versión 3 con campos opcionales: estadísticas por dificultad, evidencia de conceptos con plazo de recuperación, historia, filtro del radar, recompensas de recuperación, duración, fallos por capa y marcadores de duelo. El historial conserva hasta 30 rondas; la media filtra por modo, nivel, reloj, repaso, código exacto de clase y contexto de caso, dirección o capítulo; excluye recuperaciones. Las rondas antiguas sin tiempo muestran «Sin tiempo registrado».

## Retos reproducibles de clase

`data/class-modes.js` declara los modos compartibles y sus variantes. `domain/class-challenge.js` valida los códigos, normaliza la semilla y comprueba una huella del contenido. El formato `OSI2` identifica las reglas de selección y barajado: debe incrementarse si cambian esas reglas. La huella cambia al modificar los bancos o las variantes, impidiendo reutilizar un código con contenido incompatible.

`domain/random.js` crea un generador determinista nuevo por ronda. `features/play/session-factory.js` pasa ese mismo generador a la selección y a la sesión, incluyendo el barajado de respuestas, tarjetas y piezas. No basta con fijar solo la selección de preguntas. Los modos personales se excluyen de `class-modes.js` para no depender de estadísticas, fechas o tarjetas pendientes.

`features/class/` separa la creación/unión y las acciones de copia de las reglas del código. Las rutas `#/class/CODIGO` muestran una invitación y nunca comienzan ni puntúan una ronda automáticamente. La sesión conserva la invitación en memoria; reabrirla crea una sesión independiente desde el principio. No hay backend de clase ni envío de resultados. Los seis tests de dominio y `scripts/verify-class-browser.mjs` comprueban reproducibilidad, aislamiento de respuestas y compatibilidad.

## Persistencia

`services/progress-schema.js` migra y filtra el progreso. La clave sigue siendo `osi-quest-v1`, aunque el esquema de la copia es versión 3. Se aceptan copias de versión 2 y 3. El repositorio conserva el progreso válido existente y ofrece un modo en memoria si localStorage no está disponible.

El historial conserva las últimas 30 rondas. El guardado de práctica ocurre después de cada respuesta. Las respuestas de un examen en curso viven en memoria hasta entregar. No se almacenan claves ni cuentas. Los nombres elegidos para un duelo duran solo en la sesión; el historial persistente usa Jugador A/B.

`recordActivity()` registra las recompensas de conexiones y construcción del envío; `recordOrder()` registra orden y `recordAnswer()` añade también las estadísticas de preguntas. Los controladores guardan únicamente los nuevos resultados que devuelve la sesión. `recordAnswers()` guarda un examen en un lote con una escritura de respuestas y una notificación de recompensa; el resumen se guarda aparte. `recordRound()` conserva el resumen al completar la ronda y no vuelve a sumar su XP.

## Navegación y entrega

Las rutas hash permiten alojamientos estáticos sin configuración de servidor. Todas las referencias a recursos son relativas al documento. `scripts/build.mjs` crea `dist/` con JS/CSS agrupado, minificado, dividido en módulos y nombres con huella, más la web y `.nojekyll`, y el flujo de Pages publica esa carpeta.

El paquete incluye verificación automática y publicación manual en GitHub Pages. La entrega no implica que se haya creado un repositorio ni ejecutado la publicación en una cuenta de GitHub.

`render_game_to_text()` ofrece un resumen de solo lectura para automatización sin exponer claves de respuesta. `advanceTime(ms)` adelanta exclusivamente el reloj de supervivencia con contrarreloj, para reproducir vencimientos sin esperar 30 segundos. No expone respuestas. `app/activity-timers.js` actualiza el contador cada 200 ms solo en una pregunta contrarreloj activa y visible; no instala ese intervalo en estudio, inicio ni juegos sin reloj. Detiene los relojes según visibilidad y estado; no vuelve a dibujar toda la pantalla en cada pulso.

## Historia y experiencia de ronda

- `data/story.js` declara siete capítulos con tres decisiones, escena, explicación, analogía, pieza y actividades desbloqueadas. `domain/story-progress.js` valida una secuencia de capítulos contigua, sus requisitos y el umbral de dos decisiones correctas en una ronda completa de tres. No equipara este desbloqueo guiado a dominio independiente.
- `features/story/` presenta la red de casa, sus piezas seleccionables, las lecciones y la construcción obtenida. El modo libre sigue ofreciendo todas las actividades; los requisitos se aplican al recorrido de historia.
- `domain/round-progress.js` calcula los estados de los puntos. `components/round-progress.js` dibuja su equivalente textual y visual, preservando la confidencialidad del examen y del duelo. `components/answer-layer.js` representa la relación respuesta/capa sin mostrarla antes de responder.
- `app/round-controls.js` controla pausa, reanudación, abandono, navegación protegida y aviso de recarga. `features/play/round-controls.js` contiene el panel modal, textos y pantalla de pausa. La pausa conserva el objeto de sesión en memoria; no serializa una partida en curso.
- `app/round-layout.js` mide el máximo de enunciados y respuestas de una sesión por anchura, conserva espacio y desplazamiento, y aplica un fundido corto. Las etiquetas de aviso y racha reservan espacio. El foco de preguntas se restaura sin desplazar la ventana. No cambia las reglas del juego.
- `domain/recovery.js` marca resultados de recuperación inmediata y limita la recompensa a media XP, una vez por objetivo cada diez minutos. El repositorio excluye estos intentos de estadísticas, calendario e insignias. `practiceOnly` excluye también XP. Los repasos conservan escena, dirección, caso y piezas de contexto.
- Orden, conexiones y envío conservan el número de errores y el uso de pista por objetivo. El informe distingue intentos incorrectos de ayudas; varios intentos incorrectos pueden pertenecer a un único paso resuelto.

## Elección y estudio en 3.5

`domain/activity-preferences.js` valida los ajustes por actividad y calcula pendientes, recomendaciones y resultados comparables. El repositorio guarda filtro, preferencias y marcador de lección como campos opcionales del esquema 3. Los lanzamientos compartidos, recuperaciones e historia no sustituyen la configuración personal.

`features/study/lesson-view.js` y `lesson-controller.js` separan lectura e interacción. El marcador persiste la sección al desplazarse, con listener pasivo y limpieza al salir. Las notas y las comprobaciones viven solo en la pestaña; no modifican XP ni la evidencia del radar. Los controles de lectura sí persisten leída/para releer.

`components/answer-choices.js` y `answer-feedback.js` comparten estados visibles, alternativas explicadas y acceso de teclado entre actividades. `aria-disabled` conserva respuestas reveladas en el recorrido de revisión; los controladores impiden puntuarlas de nuevo.

## Límites añadidos en 3.6

- `components/html.js`: escape por defecto y composición raw explícita. `components/dom-renderer.js`: único análisis HTML, sanitizador local y política Trusted Types privada. Las vistas no usan sinks directamente.
- `services/progress-integrity.js` y `safe-data.js`: integridad accidental, límites de estructura y claves peligrosas. El repositorio conserva la fuente corrupta y bloquea escrituras automáticas; no se traslada ese control a cada pantalla.
- `services/backup-reader.js` / `backup-worker.js`: importación fuera del hilo de interfaz. Restore vuelve a comprobar el objeto validado antes de usarlo.
- `data/progress-catalog.js`: metadatos generados sin respuestas para arranque y validación. Cambiar el contenido exige ejecutar npm run catalog.
- `scripts/build-assets.mjs`: arranque separado de pantallas/bancos diferidos, renderizador único y CSS por ruta. Las rutas externas del renderizador se resuelven relativas a cada salida para admitir un prefijo de repositorio.
- `app/version-check.js`, `route-styles.js` y `services/idle.js`: cambios de versión, carga de estilos y precarga opcional respetando conexión.
- `dist` excluye hooks y diagnóstico; `dist-test` incorpora hooks para pruebas y no se publica. Las pruebas de producción reales navegan por controles visibles.

## Interfaz y estilos en 3.7

`components/profile-menu.js` presenta y controla el perfil; `services/interface-preferences.js` valida nombre, densidad y movimiento, separados del progreso educativo. `app/notice-priority.js` arbitra avisos, `screen-transition.js` limita animaciones a navegación y `components/field-error.js` asocia errores con sus campos. Las instrucciones de tres pasos viven en `data/activity-previews.js`.

`styleGroups` tiene un único propietario por archivo. `styleOrder` define capas CSS en el mismo orden que index.css; la visita a una ruta no cambia la cascada. `styleDependencies` declara grupos por ruta. El cargador comparte enlaces existentes y espera su carga. Un nombre virtual con prefijo group- evita la autoimportación de esbuild.

`catalog.mjs` genera los metadatos y la huella de clases; check compara ambos con el contenido. Progreso y Clase no necesitan descargar todo el banco para mostrar estadísticas o preparar un código. `build-report.mjs` exporta dependencias, tamaños gzip y presupuestos a work/build; los informes de producción y de test están separados.

## Ampliación 3.8

`domain/speedrun-session.js` mantiene el reloj global y las cadenas; la vista y los temporizadores se ocupan del DOM y de visibilidad/pausa. `domain/packet-inspector.js` decodifica bytes sin DOM; `features/inspector/` separa vista y controlador. `services/pwa.js` registra el trabajador generado por `scripts/build-pwa.mjs`; el build precachea sus módulos y estilos. `styles/themes.css` contiene los tokens alternativos. `domain/review-evidence.js` centraliza la evidencia por dificultad; la práctica focalizada conserva su capa en los informes.
