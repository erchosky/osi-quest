> Resultados históricos de 3.7. Las pruebas y límites de 3.8 se documentan en VERSION-3.8.md.

# Validación de OSI Quest 3.7

Comprobado con Node.js 22, Chromium y Playwright 1.62.1. Las pruebas usan perfiles aislados y datos inventados; el progreso del navegador habitual no se modifica.

## Reglas y contenido

`npm run verify` comprueba catálogos generados, huella de clase, renderizador único, sanitizador vendorizado, sintaxis, **121 pruebas nativas** y build. Incluye recompensas 8/20 XP y ayuda 4/10, migración, historia, insignias, radar, examen, vida/reloj, duelo, copias y límites. Se conservan las 226 preguntas/decisiones y las 18 lecciones.

Los casos nuevos impiden duplicar propietarios CSS, comparan el orden de la cascada, validan nombre/densidad/movimiento y comprueban la acción principal de los resultados. La huella generada de clases debe coincidir exactamente con el banco completo; sigue siendo 4F2A8186.

## Interacciones

Las seis suites de `npm run test:browser` suman **690 comprobaciones**:

| Suite | Comprobaciones |
| --- | ---: |
| App | 187 |
| Clase | 68 |
| Aprendizaje y modos | 136 |
| Historia y rondas | 154 |
| Accesibilidad | 61 |
| Prioridades | 84 |

Recorren examen editable, capítulos, selección/arrastre/selectores, envío, tarjetas, vidas y reloj, duelo, repaso de fallos, clase en dos perfiles, pausa/salida, copias, filtros, marcador y notas. El filtro vacío ya no aparece: se sustituye su antigua comprobación por ausencia del filtro y recuperación de preferencias antiguas. Los errores de importación se esperan después de terminar la validación, no al aparecer el estado de carga.

## Producción y aspecto

`npm run test:production` incluye 21 comprobaciones instrumentadas de cargas diferidas/carreras, 26 del build real sin hooks, 30 comparaciones visuales de pantallas y 24 del nuevo recorrido de interfaz.

La prueba visual compara desarrollo y producción en seis pantallas, con 14 propiedades calculadas, ancho y desbordamientos, a 320/390/768/1024/1440 px; genera 60 capturas. Antes del arreglo detectó 25 diferencias; después no debe detectar ninguna. Esta cobertura corrige una carencia real de las pruebas anteriores, que no detectaban los estilos descartados.

La prueba de interfaz verifica perfil, recarga, densidad/movimiento, nombres como texto, vista previa de tres pasos, capítulos bloqueados, errores junto a campos, normal → difícil, 8 XP por capa y Atrás → Seguir sin perder la ronda. Veinte navegaciones posteriores al calentamiento no crean enlaces ni peticiones CSS nuevos. Las pruebas de producción usan prefijos de repositorio distintos.

El cliente de develop-web-game respondió una decisión de historia y se revisaron su captura y estado. También se inspeccionaron las pantallas principales y ejemplos móviles. Las transiciones canceladas no generan errores no controlados; la animación se omite con movimiento reducido.

## Estabilidad

La prueba de 100 rondas y 600 navegaciones pasó en desarrollo y producción. Tras calentamiento, los listeners globales permanecen iguales. En producción hay 213 nodos antes/después y el heap crece 930.496 bytes; en desarrollo 204 nodos y 893.924 bytes. Ambos están por debajo del presupuesto de crecimiento de 4 MiB. Es un recorrido acotado, no una garantía de ausencia de cualquier fuga.

## Entrega y límites

Se verifica la integridad del ZIP, su coincidencia con las fuentes y una instalación/build desde la copia extraída. Incluye fuentes, lockfile, pruebas, scripts, documentación y workflows; excluye dependencias instaladas, builds, trabajo temporal y datos personales.

No existe aún repositorio y no se ha publicado ni ejecutado CI remoto. Safari, Firefox, dispositivos físicos y lectores de pantalla reales no se han verificado. La pausa mantiene la ronda en esta pestaña; recargarla pierde esa sesión, conservando intentos persistidos. Los indicadores orientan el aprendizaje. La revisión de propuestas y pendientes está en PRIORIDADES-3.7.md.
