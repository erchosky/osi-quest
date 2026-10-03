# Seguridad de OSI Quest

La app aprende y guarda el progreso en tu navegador. No tiene servidor de cuentas, autenticación ni clasificación competitiva. No envía nombres, respuestas ni copias a servicios externos. El almacenamiento y el código son accesibles para quien controla el dispositivo; los XP no son una prueba certificada de aprendizaje.

## Informar de un problema

Todavía no hay repositorio ni contacto público confirmado. Al crearlo, activa **Private vulnerability reporting** en GitHub y sustituye este párrafo por el enlace real a «Report a vulnerability» del repositorio. No publiques copias de progreso personales ni pruebas con datos privados en un issue público.

`docs/security.txt.example` es una plantilla pendiente de contacto y fecha reales. No se publica un `security.txt` con una dirección inventada.

## Límites y controles

- Entradas: copias JSON locales (máximo 2 MB), enlaces de clase, fragmentos de ruta y nombres de duelo. Se validan antes de usarlos; las claves de prototipo y estructuras excesivas se rechazan.
- Progreso: se conserva el texto original ilegible y se bloquea cualquier escritura automática. Solo importar una copia válida o confirmar el borrado permite sustituirlo. Los fallos transitorios de cuota se avisan y se reintentan en la siguiente modificación.
- Integridad: el checksum FNV-1a detecta daños accidentales. No es firma criptográfica, autenticación ni defensa contra alguien que modifica su propio progreso. Se mantiene la validación del esquema también al cargar.
- HTML: los valores de las plantillas se escapan; `raw()` identifica fragmentos de composición revisados. Solo el renderizador analiza HTML y lo sanitiza con DOMPurify. CSP y Trusted Types añaden controles del navegador. La política privada permite el Worker de importación y el Service Worker exacto de esta app; no autoriza URLs arbitrarias de scripts.
- Privacidad: los nombres de duelo duran en la sesión; las rondas guardadas y las copias usan Jugador A/B. Puedes exportar sin historial o borrar únicamente las rondas. No subas tus copias personales a GitHub.
- Servidor de desarrollo: escucha en 127.0.0.1, permite únicamente recursos web y comprueba la ruta canónica, incluidos índices y alias de carpetas. No sirve carpetas privadas. No es un servidor para exponer en Internet ni una defensa frente a una persona que controla y cambia concurrentemente los archivos del dispositivo.
- Dependencias: versiones exactas y lockfile, instalación sin scripts, firmas del registro, Actions fijadas por SHA y actualizaciones semanales. El sanitizador vendorizado debe coincidir con la versión instalada; la comprobación evita actualizar solo una de las dos.

## Publicación

GitHub Pages aplica la CSP y la política de referrer del HTML, pero no permite configurar las cabeceras del servidor. El archivo `_headers` del build añade `frame-ancestors`, `nosniff`, permisos y aislamiento en Netlify/Cloudflare Pages. Confirma las cabeceras reales después de publicar en el alojamiento elegido.

Consulta `docs/GITHUB-SETUP.md` antes de activar la publicación. El workflow nunca usa `pull_request_target` y solo permite publicar desde `main`.
