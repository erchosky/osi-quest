import { cases } from './cases.js';

export const classModes = [
  { id: 'FUN', kind: 'function', label: 'Cada capa, su misión' },
  { id: 'SIT', kind: 'scenario', label: 'Situaciones de la vida real' },
  { id: 'PRO', kind: 'protocol', label: '¿Dónde vive este protocolo?' },
  { id: 'EXA', kind: 'exam', label: 'Examen de las siete capas' },
  { id: 'CON', kind: 'matching', label: 'Une las conexiones' },
  { id: 'ENV', kind: 'packet', label: 'Construye el envío' },
  { id: 'ORE', kind: 'order', direction: 'send', label: 'Orden de capas · envío' },
  { id: 'ORR', kind: 'order', direction: 'receive', label: 'Orden de capas · recepción' },
  ...cases.map((item, index) => ({
    id: `CAS${index + 1}`,
    kind: 'cases',
    caseId: item.id,
    label: `Caso · ${item.title}`,
  })),
];
