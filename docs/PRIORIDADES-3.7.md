> Documento histórico de la versión 3.7. PWA, temas, inspector, sprint y práctica por capa se implementan en 3.8; consulta VERSION-3.8.md.

# Revisión y prioridades · OSI Quest 3.7

## El bloqueo de producción

Reproducción antes del arreglo: **25 diferencias en 30 comparaciones** (seis pantallas por cinco tamaños), sin errores de recursos. Las pantallas Estudiar, Jugar, Explorar, Mi progreso y Clase perdían reglas. Historia ya recibía parte de sus reglas desde el grupo inicial: la afirmación de seis pantallas completamente sin estilo era más amplia que lo reproducido.

Arreglo: nombre virtual `group-${key}.css`; cada CSS tiene un único grupo propietario y una capa de cascada explícita. Desarrollo y producción utilizan el mismo orden. La ruta espera a sus estilos antes de pintar. El cargador reutiliza también los enlaces existentes, incluso entre módulos diferidos, y vuelve a intentar cargas fallidas.

La nueva prueba `test:visual`, incluida en `test:production` y CI, compara 14 propiedades calculadas y el ancho a **320, 390, 768, 1024 y 1440 px**. Comprueba además desbordamientos y guarda 60 capturas. `test:interface` verifica 20 navegaciones sin nuevas peticiones CSS ni enlaces duplicados.

## Las 20 propuestas de interfaz

| Nº | Entrega 3.7 |
| --- | --- |
| 1 | Una tarjeta «Hoy te recomiendo»; Clase pasa a enlace secundario. |
| 2 | Tarjetas compactas: tres columnas en escritorio, dos en tamaños intermedios y una en móvil estrecho. Detalles desplegables. |
| 3 | Inicio tiene una principal: retomar lectura, continuar historia empezada o comenzar estudio. |
| 4 | Perfil desplegable único en la navegación con nivel, XP y ruta; se retira el contador lateral y el XP repetido de Inicio. |
| 5 | Acceso a búsqueda del diccionario en la cabecera. La ruta textual queda para páginas con detalle. |
| 6 | Los problemas de guardado tienen prioridad sobre actualización y avisos de contexto. La actualización espera a que termine una ronda; el XP se oculta ante avisos prioritarios y al leer desplazándose. «Guardado» se oculta mientras aparece XP. Los datos constantes del reto permanecen en su propio contexto. |
| 7 | No aparece «Repaso pendiente» con cero actividades. Un filtro antiguo vacío vuelve visualmente a Todas. |
| 8 | Muchos fallos: repetir fallos como principal. Perfecto en normal: difícil, cuando el modo lo admite. Resto: otra ronda; clases y capítulos conservan su contexto. |
| 9 | Continuación fija después de alcanzar el cierre de la lectura, sin tapar los controles originales ni la navegación móvil. |
| 10 | Mapa de capítulos con símbolos, conexiones y recorrido casa → router → Internet. |
| 11 | Vista previa de tres pasos para cada una de las 13 actividades. |
| 12 | Cabeceras más cortas; instrucciones, configuración y resultados pasan al detalle de las tarjetas. Se mantienen las explicaciones educativas completas. |
| 13 | Confirmaciones e importación como panel inferior en móvil; salida de ronda mantiene su panel accesible. |
| 14 | «Guardado ✓» solo tras una escritura persistente correcta. Fallos de cuota/guardado no muestran éxito. |
| 15 | Errores junto a semilla/código, participantes y copia importada; asociados al campo y sin perder el formulario. |
| 16 | View Transitions de 120 ms entre pantallas, con alternativa inmediata y respeto por movimiento reducido. No se aplican a respuestas de una ronda. |
| 17 | Nombre local y saludo; Inicio informa de repasos pendientes. El nombre no se exporta en las copias de aprendizaje. |
| 18 | Densidad cómoda/compacta en el perfil, persistente. |
| 19 | Indicador con esqueleto durante carga diferida; se conserva la pantalla anterior hasta que JS y CSS están preparados. |
| 20 | Selector de capítulos desde Jugar con construidos, disponibles y bloqueados. |

## Rendimiento: revisión de las 20 propuestas del adjunto

| Nº | Estado y prioridad |
| --- | --- |
| 1 | **P0 cerrado:** colisión CSS y regresión visual de desarrollo/producción. |
| 2 | **Hecho:** responsive pertenece solo al grupo inicial; capas conservan su prioridad al cargar rutas. |
| 3 | **Hecho:** play/choice/learning se descargan como grupo de juego compartido, una vez. |
| 4 | **Hecho:** prueba de 20 navegaciones, peticiones y enlaces. |
| 5 | **Hecho:** informe con metafile y mayores entradas. Progreso usa metadatos; Clase usa huella generada del banco, comprobada contra el contenido completo. |
| 6 | **Hecho parcialmente:** informe de tamaños y presupuestos como artefacto de CI. Comparación histórica automática de PR queda **P2**, sin inventar repositorio ni publicar comentarios. |
| 7 | **P2:** conservar un solo sanitizador local y la política existente. Adoptar otra API exige comprobar el mismo corpus de HTML y su disponibilidad en navegadores objetivo. |
| 8 | **P2:** evitar caché global de HTML sin evidencia de coste; las pantallas dependen de estado cambiante. |
| 9 | **Ya cubierto:** fallback de idle a temporizador cuando no existe requestIdleCallback. |
| 10 | **Ya cubierto en importación:** Worker con límites de tamaño y tiempo. Diferir examen/informes queda **P2** si una medición demuestra tareas largas. |
| 11 | **Hecho:** esperar estilos antes de pintar; no se afirma haber obtenido una medición Lighthouse de CLS. |
| 12 | **Hecho en actividades:** content-visibility y tamaño intrínseco; historial está limitado a 30 rondas. |
| 13 | **Hecho en disposición:** menos bloques iniciales y detalle cerrado. La vista previa añade elementos; no se presume menor número total de nodos. |
| 14 | **Hecho:** precarga de JS y CSS desde Configurar hacia su juego. |
| 15 | **Hecho:** Inicio precarga Jugar al mostrar intención mediante foco/puntero; respeta ahorro de datos y cancela la espera al salir. |
| 16 | **Sin necesidad actual:** no hay will-change permanente en el recorrido de paquetes. |
| 17 | **Hecho:** tipografía del sistema; no depender de Avenir disponible solo en algunos equipos. |
| 18 | **P2:** iconos pequeños actuales; no añadir herramienta de optimización sin mejora medible. |
| 19 | **P1 pendiente de dispositivos:** prueba física Android de gama baja y medición Lighthouse 4G/CPU. La emulación de anchuras no la sustituye. |
| 20 | **Hecho:** presupuestos estimados gzip: inicio 55 KiB, Jugar incremental 30 KiB, estudio 32 KiB y demás pantallas 40 KiB. |

## Orden visual: revisión de las 20 propuestas

| Nº | Estado y prioridad |
| --- | --- |
| 1 | Escala de espacio compartida añadida; sustituir todos los valores históricos queda P2. |
| 2 | Se mantiene escala tipográfica existente; font del sistema consistente. Unificar todos los tamaños históricos: P2. |
| 3 | Tokens para radios de controles/tarjetas; migración completa de cada radio antiguo: P2. |
| 4 | Tarjetas compactas y sombra reservada para paneles flotantes; quedan estilos históricos por uniformar: P2. |
| 5 | Una principal en Inicio/Jugar y resultados libres; las confirmaciones tienen su acción propia. |
| 6 | Niveles de lectura: recomendación, actividades y detalles; Clase secundaria. |
| 7 | Cabecera y descripción reutilizables; plantilla única con acción derecha para todas las vistas: P2. |
| 8 | Semántica de acierto, error, ayuda y capa conservada; tokens comunes añadidos. |
| 9 | Los colores de las siete capas se mantienen en mapas y explicación. |
| 10 | Iconos y etiquetas actuales conservados; crear 13 iconos exclusivos: P2. |
| 11 | Etiquetas conservan información de orden, vidas, arrastre, pendiente o configuración. |
| 12 | Flechas indican continuación; no se añade animación decorativa a cada acción. Revisión global del repertorio: P2. |
| 13 | Ancho máximo y márgenes del shell conservados; tarjetas de 3/2/1 columnas. |
| 14 | Se conserva la adaptación probada. Migrar todos los breakpoints a consultas de contenedor: P2, sin reescribir durante un arreglo crítico. |
| 15 | Ritmo más compacto y tokens nuevos; sustitución integral de márgenes históricos: P2. |
| 16 | Lectura alineada a izquierda; resultados y celebraciones mantienen centrado. |
| 17 | El hero oscuro sigue reservado al Inicio. |
| 18 | Radar, mapa y gráficos mantienen sus colores y etiquetas legibles; una biblioteca común de gráficos: P2. |
| 19 | Filtros de Jugar sticky. Buscar en diccionario conserva debounce y limpieza; filtro sticky del diccionario: P2. |
| 20 | Capturas y estilos calculados en las cinco anchuras; guía de estilos interactiva de desarrollo: P2. |

## Terminar la app: prioridades restantes

El texto adjunto trae diez propuestas en este apartado, aunque su encabezado anuncia veinte.

| Orden | Propuesta | Decisión |
| --- | --- | --- |
| P0 | CSS, foco al contenido, Atrás en ronda, cabecera móvil | CSS corregido; el enlace al contenido se conserva único y mueve el foco sin convertirse en una ruta hash. Prueba real de Atrás → Seguir mantiene la ronda. Cabecera verificada a cinco anchuras. |
| P1 | Mejorar los 31 distractores difíciles antiguos, pistas y tarjetas superiores; quitar respuesta directa en orden normal | Revisión educativa separada. Estas preguntas no se han sustituido en una entrega de interfaz. Normal conserva su mapa guiado; difícil exige más recuerdo. |
| P1 | Cambios de progreso entre pestañas | Pendiente. No se implementa una mezcla automática que pueda duplicar XP o sobrescribir avances. |
| P1 | Safari, Firefox y dispositivos físicos | Pendiente de ejecución en esos entornos. La matriz de esta entrega confirma Chromium y tamaños emulados. |
| P2 | Ajustes generales de dificultad/reloj/sonido | Nombre, densidad y movimiento ya entregados; dificultad/reloj siguen en la configuración de cada actividad. Sonido y una pantalla general quedan pendientes. |
| P2 | Tema oscuro | Pendiente de comprobar contraste en todas las respuestas y mapas. |
| P2 | PWA e instalación sin conexión | Pendiente de diseñar actualización de caché/versiones y sus pruebas. La entrega sigue siendo una web estática. |
| P2 | Bienvenida guiada de 60 s | Hay una principal y recomendación; asistente inicial pendiente. |
| P2 | Reportar pregunta mediante archivo | Pendiente; no se envían mensajes a terceros. |
| P2 | Pantalla de novedades | Este ZIP incluye CHANGELOG.md; una pantalla dentro de la app queda pendiente. |

La siguiente ampliación con más valor educativo es P1: calidad de distractores y pistas, progreso coherente entre pestañas y navegador real. Tema oscuro, sonido e instalación vienen después. Los XP, las lecciones y el radar orientan la práctica; no certifican dominio completo de redes.
