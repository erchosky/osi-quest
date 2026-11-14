# OSI Quest 3.9.4 · Inicio en colores forzados

El círculo decorativo de Inicio usaba un borde casi transparente. Al activar colores forzados, el navegador sustituía ese color por el color de texto del sistema y dibujaba una línea visible sobre el bloque principal.

La regla `@media (forced-colors: active)` de `src/styles/home.css` elimina únicamente ese pseudo-elemento decorativo. Al desactivar colores forzados, el adorno recupera su aspecto habitual.

## Validación local

- Error reproducido con Chromium antes del cambio y captura antes/después inspeccionada.
- **150 pruebas nativas**, catálogos, sintaxis y build correctos.
- **62 comprobaciones de accesibilidad** en desarrollo, incluida la nueva regresión de Inicio.
- **39 comprobaciones de producción**, incluyendo el cambio dinámico de colores forzados y su desactivación a 390×844, 740×360 y 1280×900. El botón principal permanece visible y con foco de teclado; no hay desbordamiento horizontal.
- Capturas de producción y cliente de minijuegos inspeccionados. Sin errores de ejecución en las suites finales. Formato correcto.

Las regresiones forman parte de las suites de accesibilidad y producción que ya ejecuta el workflow de GitHub. CI remoto no ejecutado durante esta corrección. El ZIP se comprueba desde una extracción limpia antes de publicar.
