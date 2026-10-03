# Preparación al crear el repositorio

1. Sube el contenido de la carpeta del ZIP y conserva el lockfile. No incluyas node_modules, dist-test, work, copias personales ni capturas propias. El ZIP no contiene esos archivos.
2. Crea una rama principal llamada `main`. Activa una regla de protección: cambios mediante PR, revisión requerida y comprobación «Verificar / verify» obligatoria. Activa secret scanning y push protection si están disponibles para tu repositorio.
3. Copia `.github/CODEOWNERS.example` a `.github/CODEOWNERS` y sustituye el usuario de ejemplo por el tuyo. No queda activado un responsable ficticio.
4. Activa GitHub Pages con origen GitHub Actions. En el entorno `github-pages`, limita las ramas de despliegue a `main` y añade revisión si quieres aprobar cada publicación. El workflow ya comprueba `main`, pero la regla del entorno la configura el propietario en GitHub.
5. Activa informes privados de vulnerabilidades y añade el enlace real a SECURITY.md. Completa `docs/security.txt.example` con contacto HTTPS válido y caducidad real; publícalo en `/.well-known/security.txt` desde tu alojamiento.
6. Revisa los PR de Dependabot. Si actualiza DOMPurify, actualiza también `src/vendor/dompurify.js` y su licencia desde el paquete instalado; `npm run check` exige que coincidan. Las Actions se fijan por commit completo y Dependabot puede proponer su actualización.

No se ha creado ni publicado ningún repositorio. Las protecciones anteriores requieren el repositorio y sus permisos; no se pueden activar desde un ZIP.

## Dependencias y CI

`npm ci --ignore-scripts` evita ejecutar scripts de terceros. esbuild usa su binario opcional específico de plataforma, ya fijado por el lockfile. Playwright también está fijado; descargar Chromium se hace explícitamente con `npx playwright install --with-deps chromium` en CI. `npm audit signatures` verifica las firmas/atestaciones del registro y necesita red. Las verificaciones de navegador usan datos inventados; los informes quedan en work, fuera del ZIP y del build.
