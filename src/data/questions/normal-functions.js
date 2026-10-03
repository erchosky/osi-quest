import { hardFunction } from './hard-authoring.js';

const variants = [
  [
    1,
    'Una fibra lleva los bits mediante luz. ¿Qué capa describe ese trabajo?',
    [2, 3, 6],
    'Física transmite las señales por el medio: en este caso, luz por la fibra.',
    'Piensa en el medio que lleva los 0 y 1.',
  ],
  [
    2,
    'Un switch entrega una trama usando la MAC del destinatario. ¿Qué capa describe esa entrega local?',
    [1, 3, 4],
    'Enlace de datos organiza la entrega de tramas en el enlace mediante direcciones MAC.',
    'La pista es la trama y su dirección local.',
  ],
  [
    3,
    'Un router decide por dónde mandar un paquete hacia otra red. ¿Qué capa describe la decisión?',
    [2, 4, 7],
    'Red encamina paquetes entre redes según su destino lógico, por ejemplo una IP.',
    'Busca la función que escoge el camino entre redes.',
  ],
  [
    4,
    'En una IP hay varios servicios. ¿Qué capa utiliza puertos lógicos para distinguirlos?',
    [2, 3, 5],
    'Transporte distingue procesos y servicios con información como los puertos TCP o UDP.',
    'Una dirección lleva al edificio; el puerto permite distinguir a quién entregar dentro.',
  ],
  [
    5,
    'En el modelo OSI, organizar un diálogo y sus puntos de sincronización corresponde a…',
    [4, 6, 7],
    'Sesión coordina el diálogo. No equivale necesariamente a un acceso con usuario y contraseña.',
    'Piensa en abrir, mantener y terminar una conversación.',
  ],
  [
    6,
    'Dos equipos acuerdan cómo representar el texto para entenderlo. ¿Qué capa describe esa función?',
    [4, 5, 7],
    'Presentación describe la representación e interpretación compartida de los datos.',
    'Como dos personas que acuerdan una forma común de escribir.',
  ],
  [
    7,
    'Solicitar una página con HTTP es un servicio de…',
    [3, 4, 6],
    'Aplicación ofrece servicios de red como solicitar páginas mediante HTTP. El navegador utiliza también otras funciones.',
    'Piensa en la ventanilla donde pides el servicio.',
  ],
];

export const normalFunctionQuestions = variants.map(
  ([layer, prompt, distractors, explanation, hint]) => ({
    ...hardFunction(layer, 1, prompt, distractors, explanation, hint),
    id: `normal-function-${layer}-extra`,
    difficulty: 'normal',
    tricky: false,
  }),
);
