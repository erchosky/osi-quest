export const contentSources = {
  osi: 'https://www.itu.int/rec/T-REC-X.200-199407-I/en',
  ethernet: 'https://www.ieee802.org/3/publication/index.html',
  wifi: 'https://www.ieee802.org/11/abt80211.html',
  ip: 'https://www.rfc-editor.org/rfc/rfc8200.html',
  tcp: 'https://www.rfc-editor.org/rfc/rfc9293.html',
  udp: 'https://www.rfc-editor.org/rfc/rfc768.html',
  quic: 'https://www.rfc-editor.org/rfc/rfc9000.html',
  icmp: 'https://www.rfc-editor.org/rfc/rfc4443.html',
  session: 'https://www.itu.int/rec/T-REC-X.225-199511-I/en',
  presentation: 'https://www.itu.int/rec/T-REC-X.226-199407-I/en',
  tls: 'https://www.rfc-editor.org/rfc/rfc8446.html',
  dns: 'https://www.rfc-editor.org/rfc/rfc1035.html',
  http: 'https://www.rfc-editor.org/rfc/rfc9110.html',
  dhcp: 'https://www.rfc-editor.org/rfc/rfc2131.html',
};

/** Correct choice is authored first; the session shuffles indices without breaking explanations. */
export function hardQuestion(
  type,
  layer,
  number,
  prompt,
  options,
  explanation,
  hint,
  sources = ['osi'],
) {
  return {
    id: `hard-${type}-${layer}-${number}`,
    type,
    layer,
    difficulty: 'hard',
    tricky: true,
    layerQuestion: false,
    prompt,
    choices: options.map(([choice]) => choice),
    whyChoices: options.map(([, why]) => why),
    correctIndex: 0,
    explanation,
    hint,
    sources: sources.map((source) => contentSources[source]),
  };
}

const names = [
  'Física',
  'Enlace de datos',
  'Red',
  'Transporte',
  'Sesión',
  'Presentación',
  'Aplicación',
];
const roles = [
  'Física transmite bits como señales; no interpreta tramas, rutas ni servicios.',
  'Enlace organiza tramas y la comunicación del enlace; no elige rutas entre redes.',
  'Red direcciona y encamina paquetes; no coordina el diálogo ni la representación de datos.',
  'Transporte comunica procesos mediante servicios como TCP o UDP; no es cualquier tarea que implique enviar datos.',
  'Sesión coordina el diálogo y su sincronización; no equivale a una cuenta de usuario ni a cualquier conexión.',
  'Presentación trata la representación de datos; no significa mostrar botones ni decidir cómo circulan.',
  'Aplicación define servicios de red y sus operaciones; no engloba como una sola capa todo el programa.',
];

export function hardFunction(layer, number, prompt, distractors, explanation, hint) {
  const options = [layer, ...distractors].map((candidate, index) => [
    names[candidate - 1],
    index === 0 ? explanation : roles[candidate - 1],
  ]);
  return hardQuestion('function', layer, number, prompt, options, explanation, hint);
}
