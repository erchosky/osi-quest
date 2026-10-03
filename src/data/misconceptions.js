import { additionalMisconceptionProbes } from './questions/misconception-probes.js';

function probe(id, layer, prompt, choices, explanation, hint) {
  return {
    id,
    layer,
    prompt,
    choices,
    correctIndex: 0,
    explanation,
    hint,
    difficulty: 'normal',
    type: 'confusion',
    layerQuestion: false,
  };
}
export const misconceptions = [
  {
    id: 'tcp-security',
    title: 'TCP entrega; TLS protege',
    description: 'Distingues fiabilidad de confidencialidad.',
    icon: '◇',
    questions: [
      probe(
        'proof-tcp-1',
        4,
        'Una web usa HTTP sobre TCP, sin TLS. ¿Qué aporta TCP a los datos?',
        [
          'Entrega fiable y ordenada, sin cifrarlos por sí mismo',
          'Confidencialidad y autenticación del servidor por sí mismo',
          'Entrega fiable y confidencialidad en todos los enlaces',
          'Cifrado del contenido, pero sin control del orden',
        ],
        'TCP ofrece mecanismos de entrega fiable y ordenada. El uso de TCP no cifra el contenido: para proteger una web se utiliza TLS, entre otras funciones.',
        'Separar entrega y protección ayuda: ¿qué trabajo realiza TCP?',
      ),
      probe(
        'proof-tcp-2',
        7,
        'Para proteger el contenido de una petición web, ¿qué opción encaja?',
        [
          'HTTPS con TLS para proteger la comunicación',
          'HTTP con TCP porque sus confirmaciones ya cifran',
          'HTTP con un puerto distinto porque cambia el cifrado',
          'HTTP con otra IP porque oculta todo el contenido',
        ],
        'HTTPS emplea TLS. Cambiar IP o puerto no convierte HTTP en una comunicación cifrada.',
        'El protocolo que confirma entregas no es el que protege el contenido.',
      ),
    ],
  },
  {
    id: 'dns-transport',
    title: 'DNS pregunta; UDP transporta',
    description: 'Clasificas por función, aunque un protocolo use otro.',
    icon: '↗',
    questions: [
      probe(
        'proof-dns-1',
        7,
        'Una consulta DNS viaja mediante UDP. ¿Qué capa describe la función de DNS?',
        [
          'Aplicación: resolver un nombre mediante su servicio',
          'Transporte: porque utiliza mensajes de UDP',
          'Red: porque la respuesta puede contener una IP',
          'Enlace: porque cruza una red local',
        ],
        'DNS presta un servicio de aplicación. UDP transporta sus mensajes; eso no cambia la función de DNS.',
        'Clasifica el servicio de nombres, no el vehículo de sus mensajes.',
      ),
      probe(
        'proof-dns-2',
        7,
        'El mismo servicio DNS utiliza TCP en otro intercambio. ¿Qué sigue siendo cierto?',
        [
          'DNS sigue en aplicación y TCP realiza transporte',
          'DNS cambia a transporte al cambiar su vehículo',
          'TCP cambia a aplicación al transportar nombres',
          'DNS y TCP realizan la misma función de red',
        ],
        'Un protocolo de aplicación puede usar distintos transportes. Cada uno mantiene su función.',
        'Una aplicación puede elegir distintos transportes sin cambiar su función.',
      ),
    ],
  },
  {
    id: 'addressing',
    title: 'IP, MAC y puerto en su sitio',
    description: 'Separar destino de red, entrega local y servicio.',
    icon: '◎',
    questions: [
      probe(
        'proof-address-1',
        3,
        'Para enviar un paquete hacia otra red, ¿qué dato usa el encaminamiento IP?',
        [
          'La dirección IP de destino del paquete',
          'El puerto TCP de destino como ruta de red',
          'La MAC original como dirección de toda Internet',
          'El nombre del archivo como siguiente salto',
        ],
        'La función de red encamina según direcciones IP. La entrega por cada enlace y la elección del servicio son trabajos diferentes.',
        'Piensa en el destino lógico de red, no en la entrega del enlace.',
      ),
      probe(
        'proof-address-2',
        4,
        'Dos servicios de un servidor comparten IP. ¿Cómo se distingue el destino en transporte?',
        [
          'Por el puerto de destino y el protocolo de transporte',
          'Por la MAC del usuario que visita cada servicio',
          'Por la longitud del cable conectado al servidor',
          'Por el nombre de la capa OSI utilizada',
        ],
        'Los puertos permiten distinguir servicios o procesos junto con los demás datos del intercambio.',
        'Una IP puede alojar varios servicios; busca el identificador de transporte.',
      ),
    ],
  },
  {
    id: 'session-login',
    title: 'Una cuenta no define una capa',
    description: 'Distingues un acceso a una cuenta de la coordinación OSI.',
    icon: '⌁',
    questions: [
      probe(
        'proof-session-1',
        7,
        'Una web verifica una contraseña. ¿Cómo clasificas esa operación concreta?',
        [
          'Como una operación del servicio de aplicación',
          'Como sesión OSI solo por llamarse iniciar sesión',
          'Como transporte porque contiene una contraseña',
          'Como enlace porque se identifica a una persona',
        ],
        'El acceso a una cuenta lo gestiona la aplicación. El nombre informal «sesión» no decide por sí solo la capa OSI.',
        'Clasifica la operación que realiza el servicio, no su nombre cotidiano.',
      ),
      probe(
        'proof-session-2',
        5,
        'En OSI, ¿qué ejemplo describe la coordinación de una sesión?',
        [
          'Organizar un diálogo con puntos para reanudarlo',
          'Elegir la ruta IP al servidor que verifica una cuenta',
          'Convertir cada bit en una señal del medio físico',
          'Determinar el puerto del proceso que recibirá datos',
        ],
        'La capa de sesión coordina diálogos y puede incluir sincronización. En protocolos reales estas funciones pueden integrarse en la aplicación.',
        'Piensa en coordinar el diálogo y su continuidad.',
      ),
    ],
  },
  {
    id: 'compression-security',
    title: 'Comprimir y cifrar son distintos',
    description: 'Distingues tamaño de representación y confidencialidad.',
    icon: '▱',
    questions: [
      probe(
        'proof-compress-1',
        6,
        'Comprimes una foto para enviarla. ¿Qué puedes afirmar sin otro mecanismo?',
        [
          'Has cambiado su representación para reducir tamaño',
          'Has protegido su contenido frente a cualquier lector',
          'Has autenticado automáticamente a quien la recibe',
          'Has garantizado que nunca se perderá en la red',
        ],
        'Comprimir puede reducir tamaño. No proporciona por sí mismo confidencialidad, autenticación ni garantías de entrega.',
        'Reducir el tamaño y proteger el contenido tienen objetivos diferentes.',
      ),
      probe(
        'proof-compress-2',
        6,
        'Quieres enviar una foto pequeña y protegida. ¿Qué combinación tiene sentido?',
        [
          'Comprimirla y proteger la comunicación mediante cifrado',
          'Comprimirla dos veces para obtener confidencialidad',
          'Cambiar su dirección IP para cifrar todos sus datos',
          'Usar un puerto distinto para autenticar al receptor',
        ],
        'La compresión y el cifrado pueden coexistir. Cada función resuelve un problema diferente.',
        'Necesitas una función para tamaño y otra para protección.',
      ),
    ],
  },
  {
    id: 'connectivity-service',
    title: 'Una prueba, una conclusión',
    description: 'Distingues conectividad de funcionamiento del servicio.',
    icon: '✓',
    questions: [
      probe(
        'proof-health-1',
        7,
        'El servidor responde a ping. ¿Qué prueba adicional verifica el recurso web?',
        [
          'Enviar una petición HTTP y examinar la respuesta',
          'Repetir ping y asumir que el recurso ya funciona',
          'Comprobar la MAC y asumir que HTTP acepta peticiones',
          'Mirar el puerto del cable como prueba del recurso',
        ],
        'Una respuesta de conectividad no verifica el recurso de una web. HTTP comprueba otro servicio y ofrece otra evidencia.',
        'Cada prueba verifica una función concreta.',
      ),
      probe(
        'proof-health-2',
        7,
        'DNS responde con una IP. ¿Qué necesitas comprobar para saber si la web sirve la página?',
        [
          'La respuesta HTTP del recurso solicitado',
          'Solo otra respuesta DNS con esa misma IP',
          'Solo la velocidad anunciada por la tarjeta de red',
          'Solo el nombre de la capa física del portátil',
        ],
        'Resolver un nombre no demuestra que el recurso web exista o responda bien. Hay que comprobar el servicio.',
        'Resolver el nombre y solicitar la página son pasos distintos.',
      ),
    ],
  },
].map((concept) => ({
  ...concept,
  questions: [...concept.questions, ...additionalMisconceptionProbes[concept.id]],
}));
export const misconceptionQuestions = misconceptions.flatMap((item) => item.questions);
export const misconceptionByQuestion = new Map(
  misconceptions.flatMap((item) => item.questions.map((question) => [question.id, item])),
);
