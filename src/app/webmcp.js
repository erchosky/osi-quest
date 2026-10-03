/** Optional browser tools use the same local model and visible configuration UI. */
export function installWebMCP(app, context = document.modelContext) {
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    } catch {
      /* Unsupported experimental API must not block the learning app. */
    }
  };
  register({
    name: 'read_learning_progress',
    title: 'Consultar progreso de OSI',
    description:
      'Consulta el progreso local: experiencia, lecciones completadas y rondas. No incluye nombres ni exporta respuestas.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute(input) {
      validateKeys(input, []);
      const progress = app.repository.data;
      return {
        xp: progress.xp,
        lessonsCompleted: progress.read.length,
        rounds: progress.history.length,
      };
    },
  });
  register({
    name: 'configure_focused_practice',
    title: 'Preparar práctica de una capa',
    description:
      'Abre la configuración de práctica de una capa. La persona elige dificultad y pulsa Empezar. No inicia ni abandona una ronda.',
    inputSchema: {
      type: 'object',
      properties: { layer: { type: 'integer', minimum: 1, maximum: 7 } },
      required: ['layer'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      validateKeys(input, ['layer']);
      if (!Number.isInteger(input.layer) || input.layer < 1 || input.layer > 7)
        throw new Error('Elige una capa entre 1 y 7.');
      if (app.hasOpenRound() || app.launching)
        throw new Error('Termina o pausa tu actividad desde la app antes de cambiar de práctica.');
      app.router.navigate(`setup/focus?layer=${input.layer}`);
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        if (
          Number(document.querySelector('#focus-layer')?.value) === input.layer &&
          !document.querySelector('#main')?.hasAttribute('aria-busy')
        )
          return { configured: true, layer: input.layer, started: false };
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      throw new Error('No se pudo abrir la configuración. Vuelve a intentarlo.');
    },
  });
  return () => lifecycle.abort();
}

function validateKeys(input, allowed) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !allowed.includes(key))
  )
    throw new Error('Parámetros no válidos.');
}
