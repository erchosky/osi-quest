# OSI Quest 3.9 · revisión de LISTAS.md

Revisión del 5 de octubre de 2026. Se contrastó la auditoría de Claude con el código y con producción. Los documentos aportados son observaciones, no instrucciones ejecutables. Este informe distingue correcciones comprobadas, decisiones justificadas y propuestas de producto que siguen siendo propuestas.

## Fallos corregidos y decisiones

| Observación | Resultado en 3.9 |
| --- | --- |
| Hero oscuro/automático ilegible | Pareja semántica fondo/texto propia, comprobada en ambos temas. |
| Hero de contraste elevado ilegible | Fondo negro, texto claro y acciones con contraste suficiente. |
| Viaje con texto blanco sobre tintes claros | Superficie y texto cambian juntos; conserva la identificación de capa. |
| Progreso perdido entre pestañas | Operaciones en claves independientes, orden lógico, reproducción idempotente, sincronización por storage y compactación con Web Locks. No se suman instantáneas completas. |
| Filtro activo del radar | Fondo y texto del acento definidos como pareja. |
| Ejes/etiquetas del radar oscuro | Colores del tema; valores numéricos, trazado discontinuo y equivalente textual. |
| Etapa actual de construir paquete | Usa la misma pareja de acento accesible. |
| Paso del viaje con contraste insuficiente | Texto usa el color principal del tema. |
| Números de capítulos poco legibles | Color secundario accesible y estados con símbolos y texto. |
| Números de tarjetas de Inicio poco legibles | Color secundario accesible. |
| Búsqueda móvil sin nombre | aria-label independiente del texto que se oculta. |
| Hexadecimal sin foco de teclado | Región con nombre, tabindex, foco visible y selección subrayada. |
| Espera de insignias no explicada en el reto | Explicada en Configurar y con minutos restantes tras responder. |
| Respuesta correcta demasiado larga | Revisión de 36 preguntas, además de los distractores indicados abajo. La cifra original del 61% no se reprodujo: era 88/172 = 51,2% usando longitud estricta en caracteres. |
| Absolutos como atajo de descarte | 70 distractores reescritos con errores concretos. En las 144 preguntas actuales sin opciones de nombres de capa: 35 respuestas estrictamente más largas (24,3%); ninguna opción contiene los nueve absolutos del detector. Los enunciados y explicaciones sí pueden emplearlos cuando son relevantes. |
| Contraste del texto secundario de la estructura | Tokens semánticos y tamaño mínimo de texto de 12 px en las reglas que antes usaban 8–11 px. |
| Contraste secundario de Progreso/Jugar/lectura | Misma corrección y pruebas automáticas por tema. |
| 47 duplicados de Finder en el ZIP | Build limpio y empaquetado por lista explícita; rechazo de nombres duplicados, enlaces simbólicos y comprobación de cada SHA-256. |
| Sin licencia de la app | MIT para el código original y avisos/licencia Apache-2.0 de DOMPurify incluidos en producción. |
| Subrutas desconocidas | Pantalla de ruta no encontrada; no se muestra otro modo como si fuese el solicitado. |
| Secciones 99/−1 | Validación contra las secciones reales de la lección. |
| Importación abandona una ronda pausada | La confirmación lo dice expresamente, además de comparar XP/lecciones. |
| Reinicio elimina el original protegido | Advertencia expresa y descarga del original disponible antes de confirmar. |
| Fechas importadas imposibles | Última práctica/historial no avanzan al futuro; repasos limitados a 60 días y esperas a 10 minutos. |
| markRead acepta IDs inventados | Valida el catálogo, igual que setRead. |
| Landmarks complementarios indistinguibles | Menú y estado de carga tienen nombres distintos. |
| article con role=listitem | Contenedor de elemento de lista válido. |
| Icono any/maskable | Ambos propósitos juntos son válidos, por lo que no era una invalidez del manifest. Ahora hay un icono maskable separado, con marca en su zona segura. |
| Meta móvil | Se añade mobile-web-app-capable; se conserva la compatibilidad con Safari. |
| Cachés viejas tras cerrar pestañas | Limpieza al volver a la app; conserva las cachés de versiones en instalación/espera y otras aplicaciones. |
| _headers duplicado en dist/public | Solo se publica en la raíz. |
| CI sin límite | 30 minutos por trabajo. |
| CONTRIBUTING contradice instalación segura | npm ci --ignore-scripts. |
| Auditorías históricas confusas | Marcadas como archivo histórico y enlazadas a este cierre vigente. |
| Capturas antiguas | Renovadas y añadidos ejemplos oscuro, contraste y horizontal. |
| CSP style-src-attr unsafe-inline | Decisión conservada: hay estilos propios de capas y medidas calculadas; el HTML pasa por DOMPurify y Trusted Types. El informe no demuestra una vulnerabilidad por este permiso. Eliminarlo requiere migrar esos estilos y verificar de nuevo su representación. |
| Menú cortado en 800 × 360 | Alto máximo de viewport, desplazamiento disponible y controles compactos. Se pulsa Historia en la prueba real. |
| Pregunta fuera de pantalla en horizontal | Cabecera compacta, respuestas en dos columnas, acciones fijas y enfoque del nuevo enunciado. Se comprueban la primera y la siguiente pregunta. |

Las pruebas cubren simultaneidad de dos pestañas, aciertos del mismo ítem, XP de ambos niveles, marcar/desmarcar lectura, reinicio/importación, orden dentro del mismo milisegundo, cuota llena y compactación interrumpida. El progreso previo v1/v2/v3 sigue siendo legible. Si el almacenamiento falla, se mantiene el trabajo en memoria y se permite exportarlo; no se promete guardar cuando el navegador impide escribir.

## Recomendaciones de calidad: resolución de las 30

| Nº | Propuesta | Estado |
| --- | --- | --- |
| 1 | Tokens semánticos | Hecho: sustituida la gran tabla de alias de colores por superficies, texto y parejas de estados. |
| 2 | Escala tipográfica rem | Parcial: mínimos de 12 px y tamaños pequeños en rem; no se reescalaron todos los titulares. |
| 3 | axe por tema/tamaño | Hecho: claro/oscuro/contraste/automático, 320/1280 y estados de juego. |
| 4 | Golden snapshots | Pendiente: se conservan capturas y comparación desarrollo/producción; no son baselines de píxeles aprobados. |
| 5 | Mutation testing | Pendiente; no equivale a cobertura de código. |
| 6 | Lighthouse CI | Pendiente; se mantienen presupuestos de transferencia y pruebas de estabilidad. |
| 7 | Banco JSON/YAML | Se conserva JS: estructuras verificadas, IDs y revisión generados. Migrar formato no corrige por sí mismo el contenido. |
| 8 | ESLint y Prettier | Prettier instalado, fijado y comprobado en CI. Se conserva el análisis AST y sintaxis existentes; ESLint pendiente. |
| 9 | checkJs | Pendiente; no se declara cobertura de tipos. |
| 10 | Helper de listas | Pendiente: la composición actual ya escapa texto por defecto; no se reescribieron todas las vistas. |
| 11 | Auditoría AST de escape | Existe el control de sinks; no se añadió un detector de cada interpolación. |
| 12 | Cobertura nativa | Hecho: umbrales para domain de líneas 80%, ramas 70%, funciones 80%. |
| 13 | Recuperación de errores globales | Hecho: pausa y panel con exportación de progreso, diagnóstico y recarga. |
| 14 | Storage persistente | Hecho: acción opcional en perfil, con resultado real del navegador. |
| 15 | Firefox y WebKit | Pendiente: esta entrega se valida en Chromium; no certifica Safari/iOS físico. |
| 16 | Node 22/24 | Matriz de CI configurada; ejecución local en Node 22. |
| 17 | CI paralela/caché de navegador | Matriz independiente por Node; sin nueva caché compartida del navegador. |
| 18 | Browser antes de Pages | Hecho: la publicación depende de las comprobaciones de navegador y producción. |
| 19 | Migraciones por versión | Se conserva el sanitizador compatible v1–v3, con casos de migración; descomposición pendiente. |
| 20 | Separar validadores | Se mantiene separación de estructura, integridad, importación y repositorio; schema no se dividió más. |
| 21 | Exportar diagnóstico | Hecho: eventos limitados, sin texto de notas, nombre personal ni mensaje/stack potencialmente sensible. |
| 22 | ZIP + SHA en CI | Hecho: empaquetador verificable y artefactos por versión de Node. |
| 23 | Lockfile en buildId | Hecho. |
| 24 | SW legible | Hecho: src/service-worker.js, constantes inyectadas durante build. |
| 25 | Fixture real 3.7→3.8 | Pendiente; se comprueban migración de progreso, actualización entre builds y fallo de caché. |
| 26 | Capturas de documentación por tema | Hecho. |
| 27 | Unificar temas | Semántica compartida y sin tabla duplicada de cientos de alias; se conserva media query para automático. |
| 28 | Licencias en dist | Hecho: licencia de app y texto/avisos del componente distribuido. |
| 29 | Metadatos de preguntas | Hecho: fecha, método de revisión asistida y referencia primaria; no se inventa un autor humano. |
| 30 | Comprobar enlaces semanalmente | Pendiente; no se creó una automatización que contacte servicios periódicamente. |

## Propuestas de producto: las 15 UX y 15 UI

Son ampliaciones, no fallos nuevos. No se declara implementado lo que no está disponible.

| UX | Resultado |
| --- | --- |
| 1. Reanudar ronda tras recargar | Pendiente. La pausa sigue en memoria; antes de recargar se advierte de su pérdida. |
| 2. Recordatorios de copia | Pendiente; permanece la sección de copias y el aviso cuando no se puede guardar. |
| 3. Fecha del archivo exportado | Hecho. |
| 4. Previsualización de importación | Compara XP y lecciones y advierte de la ronda; fecha e insignias pendientes. |
| 5. Deshacer borrados | Pendiente; se conserva confirmación previa y exportación. |
| 6. Repaso 14/30/60 | Hecho para preguntas y tarjetas, con reinicio al fallar. |
| 7. Prueba de nivel inicial | Pendiente. |
| 8. Búsqueda global | Pendiente; continúa el diccionario con búsqueda. |
| 9. QR de clase | Pendiente. |
| 10. Recoger códigos de resultados | Pendiente; no se añade un servidor. |
| 11. Objetivo diario | Pendiente. |
| 12. Panel de atajos | Pendiente; permanecen A–D y Mayús+F y sus indicaciones. |
| 13. Cuaderno persistente | Hecho: notas por lección, exportación/importación y sin XP. |
| 14. Examen cronometrado/PDF | Pendiente; existe examen y contrarreloj en sus modos actuales. |
| 15. Clase con longitud/mezcla | Pendiente; el código sigue fijando un modo y su contenido. |

| UI | Resultado |
| --- | --- |
| 1. Mínimo de 12 px | Hecho en los tamaños pequeños de CSS; etiquetas del diagrama ajustadas. |
| 2. Etiquetas pequeñas/espaciadas | Aumentadas; se conserva el estilo editorial de algunas cabeceras. |
| 3. Ilustración por tema | Hecho, también al cambiar desde el selector. |
| 4. Previsualizar temas | Pendiente; selector disponible y persistente. |
| 5. Radar con cifras/patrón/lista | Hecho: cifras, línea discontinua y lista textual. |
| 6. Estados de historia con forma | Hecho con símbolos y texto. |
| 7. Un solo estado vacío | Pendiente; el radar conserva su desglose por capa. |
| 8. Elevación oscura | Superficies y bordes del tema corregidos; no se añadió otro sistema de elevación. |
| 9. Menú de acciones del examen | Pendiente; acciones actuales siguen accesibles. |
| 10. Leyenda hex fija/selección | Selección subrayada y foco visible; leyenda fija pendiente. |
| 11. Maskable y monocromo | Maskable separado hecho; icono monocromo pendiente. |
| 12. Esqueletos | Ya estaban implementados; se conservan. |
| 13. Monoespaciado de identificadores | Inspector mantiene fuente monoespaciada; unificación en todas las lecciones pendiente. |
| 14. Sistema reducido de botones | Pendiente; se corrigen las parejas de color existentes. |
| 15. Lectura sticky más visible | Barra e índice existentes se conservan con texto legible; nuevo diseño pendiente. |

## Validación y límites

- Verificación de sintaxis, catálogo, integridad del componente vendorizado y análisis de sinks.
- 140 pruebas nativas; cobertura de domain por encima de los umbrales.
- Seis suites de interacciones completas (690 comprobaciones), producción real e instrumentada, comparación CSS desarrollo/producción y las pruebas de PWA.
- Suite de auditoría: 135 comprobaciones, incluidos juegos antes y después de respuestas, sin incidencias de axe en la matriz probada.
- Estabilidad: 100 rondas y 600 navegaciones, sin crecimiento de nodos/listeners; el heap permanece dentro del límite de la prueba.
- Cliente del flujo de minijuegos ejecutado e inspección de sus capturas y estado.
- ZIP con manifiesto de hashes, integridad y extracción/instalación limpia verificadas antes de la entrega.

Los resultados de CI de GitHub no existen todavía: no hay repositorio del usuario. La matriz Node 24 queda configurada, no ejecutada localmente. Las pruebas automáticas y las capturas no certifican toda WCAG ni cada navegador/dispositivo. La estimación del radar y los XP describen práctica; no garantizan dominio completo de OSI. Las propuestas pendientes están identificadas para que no se confundan con funciones entregadas.
