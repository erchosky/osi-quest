export const transportLesson = {
  introduction:
    'Transporte ofrece comunicación entre procesos de los extremos. Aprenderás a distinguir puertos de conectores, datos entregados de operaciones completadas, y las garantías de TCP de lo que UDP aporta por sí mismo.',
  sections: [
    {
      title: 'Llegar al equipo no basta',
      paragraphs: [
        'Un equipo puede atender una web, una transferencia y otras comunicaciones a la vez. IP permite direccionar hacia él; TCP o UDP utilizan puertos para distinguir comunicaciones con procesos. La combinación de protocolo, direcciones y puertos permite separar intercambios.',
        'Piensa en el departamento destinatario de un envío. La dirección lleva al edificio y el número de departamento distingue a quién se entrega al final. Enlace, en cambio, entrega cada trama a una interfaz del tramo local. Un puerto TCP no es un agujero del router ni un puerto físico del switch.',
      ],
    },
    {
      title: 'Dos clientes, un servicio',
      paragraphs: [
        'El servicio web de un servidor escucha en TCP 443. Tu navegador inicia una comunicación desde un puerto temporal, por ejemplo 51000. Otro cliente puede usar otro puerto de origen, incluso para llegar al mismo servicio de destino.',
        'Al responder, el servidor usa los datos de esa comunicación para devolver información al cliente correspondiente. Memorizar solo «443 = web» no explica los dos sentidos ni todas las posibilidades: un servicio puede configurarse en otro puerto, y el número por sí solo no demuestra qué protocolo de aplicación se usa.',
        'TCP 443 y UDP 443 pertenecen a espacios de transporte distintos. La existencia de uno no verifica que el otro funcione. La IP y el puerto de destino son útiles para investigar, pero no bastan como certificado de identidad o seguridad.',
      ],
    },
    {
      title: 'Cómo ayuda TCP a entregar un flujo',
      paragraphs: [
        'TCP proporciona un flujo de bytes fiable y ordenado. Los números de secuencia, confirmaciones y retransmisiones permiten gestionar pérdidas y datos que llegan fuera de orden. Los límites de sus segmentos no tienen por qué coincidir con los mensajes que la aplicación escribió.',
        'El control de flujo tiene en cuenta lo que puede recibir el otro extremo; el de congestión adapta el envío a las condiciones de la red. Son mecanismos distintos. Ninguno garantiza que una conexión sobreviva a cualquier fallo ni que una compra se complete.',
      ],
      items: [
        'Segmento TCP: unidad de transporte que lleva parte del flujo y su cabecera.',
        'Fiabilidad y orden: propiedades de entrega, no cifrado del contenido.',
        'La aplicación necesita su propio formato para distinguir mensajes dentro del flujo.',
      ],
    },
    {
      title: 'Qué cambia al utilizar UDP',
      paragraphs: [
        'UDP envía datagramas con puertos y una cabecera pequeña. No aporta por sí mismo entrega fiable, orden ni protección frente a duplicados como un flujo TCP. Esto no significa que carezca de comprobación de errores o que toda aplicación sobre UDP deba aceptar pérdidas sin hacer nada.',
        'Una conversación en directo puede preferir descartar audio que ya llega tarde. Una aplicación también puede añadir recuperación o usar un protocolo como QUIC sobre UDP. Elige según las necesidades de la tarea; «UDP siempre es más rápido» no sustituye ese razonamiento.',
      ],
    },
    {
      title: 'Entregar datos no equivale a atender la petición',
      paragraphs: [
        'Una confirmación TCP indica progreso de recepción del flujo por el transporte del otro extremo. No demuestra que su aplicación haya leído, validado o guardado una operación. Para saber que una reserva se aceptó necesitas una respuesta del servicio con ese significado.',
        'Tampoco TCP cifra automáticamente el flujo. TLS puede aportar protección y comprobaciones de identidad; son funciones diferentes. Una conexión TCP establecida y un aviso de certificado pueden coexistir sin contradicción.',
      ],
      items: [
        'Si una IP responde pero un servicio no, comprueba transporte, puerto, filtrado y disponibilidad.',
        'Distingue rechazo de conexión, espera agotada y respuesta de aplicación.',
        'No conviertas un único síntoma en una causa o capa demostrada.',
      ],
    },
    {
      title: 'Límites y un resumen que puedas explicar',
      paragraphs: [
        'Red dirige paquetes entre redes; Transporte comunica procesos de los extremos; Aplicación interpreta el servicio. En TCP/IP, Transporte conserva una correspondencia cercana con OSI 4, aunque los protocolos reales pueden combinar responsabilidades.',
        'Explica una descarga y una llamada en directo: ¿necesitan todos los datos completos, datos a tiempo o ambas cosas? Después separa tres preguntas: llegaron los bytes, estaban protegidos y la aplicación confirmó la operación.',
      ],
    },
  ],
  takeaway:
    'Transporte comunica procesos. TCP organiza un flujo fiable; UDP no aporta esas mismas garantías por sí mismo. Entrega no significa cifrado ni éxito de la operación.',
  teachBack:
    'Explica por qué recibir una confirmación TCP de los datos de una reserva no demuestra todavía que el hotel haya aceptado la reserva.',
  check: {
    prompt:
      'El transporte TCP del servidor confirma los bytes de una solicitud de reserva, pero aún no llega una respuesta del servicio. ¿Qué sigue sin estar demostrado?',
    choices: [
      'Que TCP pueda distinguir la comunicación mediante direcciones y puertos.',
      'Que el transporte receptor haya confirmado parte del flujo de bytes.',
      'Que TCP gestione la entrega con números de secuencia y confirmaciones.',
      'Que la aplicación haya procesado y aceptado la reserva solicitada.',
    ],
    correctIndex: 3,
    reasons: [
      'Las direcciones y puertos forman parte de la comunicación de transporte; la duda pendiente trata del resultado del servicio.',
      'La situación proporciona precisamente una confirmación del transporte. Lo que falta es la respuesta con significado de aplicación.',
      'Estos mecanismos explican la confirmación, pero no verifican que el servicio haya aceptado una reserva.',
      'Confirmar bytes en TCP no equivale a aceptar una operación en la aplicación.',
    ],
    explanation:
      'Transporte y servicio tienen contratos distintos: los bytes recibidos pueden esperar lectura, validación o almacenamiento. Necesitas evidencia de aplicación para afirmar que la reserva se aceptó.',
  },
};
