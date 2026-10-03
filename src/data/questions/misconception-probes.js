import { contentSources } from './hard-authoring.js';

function probe(id, layer, prompt, options, explanation, hint, sources) {
  return {
    id,
    layer,
    prompt,
    correctIndex: 0,
    choices: options.map(([choice]) => choice),
    whyChoices: options.map(([, why]) => why),
    explanation,
    hint,
    difficulty: 'normal',
    type: 'confusion',
    layerQuestion: false,
    sources: sources.map((source) => contentSources[source]),
  };
}

export const additionalMisconceptionProbes = {
  'tcp-security': [
    probe(
      'proof-tcp-3',
      4,
      'TCP confirma que unos bytes han llegado. ¿Qué NO demuestra esa confirmación por sí sola?',
      [
        [
          'Que el contenido haya viajado cifrado',
          'Confirmar entrega no demuestra confidencialidad.',
        ],
        [
          'Que el receptor TCP ha confirmado esos bytes',
          'Es precisamente la información pertinente de la confirmación.',
        ],
        [
          'Que TCP está utilizando su mecanismo de entrega',
          'La confirmación forma parte del mecanismo TCP.',
        ],
        [
          'Que se ha intercambiado información de transporte',
          'Una confirmación TCP sí aporta información de transporte.',
        ],
      ],
      'La confirmación de entrega no prueba cifrado. TCP y TLS resuelven responsabilidades distintas.',
      'Llegar y viajar en secreto son objetivos distintos.',
      ['tcp', 'tls'],
    ),
    probe(
      'proof-tcp-4',
      7,
      'Una petición HTTPS recibe respuesta, pero la página muestra un error. ¿Qué puedes separar?',
      [
        [
          'Protección de la comunicación y funcionamiento del recurso son cosas distintas',
          'TLS puede proteger un intercambio cuyo servicio devuelve un error.',
        ],
        [
          'Si existe cualquier error, TCP ha perdido necesariamente todos los datos',
          'Un error de aplicación puede recibirse en una comunicación con entrega correcta.',
        ],
        [
          'HTTPS obliga a que todas las páginas funcionen siempre',
          'La protección no garantiza que exista o funcione un recurso.',
        ],
        [
          'Un error HTTP elimina el cifrado automáticamente',
          'Un código de aplicación no implica que el intercambio haya dejado de estar protegido.',
        ],
      ],
      'TLS protege la comunicación; el servicio HTTP define sus resultados. La seguridad no garantiza disponibilidad ni ausencia de errores en el recurso.',
      'Una carta cerrada puede traer una mala noticia sin dejar de estar cerrada.',
      ['tls', 'http'],
    ),
  ],
  'dns-transport': [
    probe(
      'proof-dns-3',
      7,
      'DNS te devuelve una dirección IP. ¿Por qué sigue siendo aplicación?',
      [
        [
          'Porque presta un servicio de información de nombres',
          'La responsabilidad de DNS es responder sobre información asociada a nombres.',
        ],
        [
          'Porque DNS elige todos los saltos de cada paquete',
          'Las decisiones de encaminamiento IP no las realiza DNS.',
        ],
        [
          'Porque una respuesta con IP convierte DNS en la capa de red',
          'El dato entregado no transforma la función del servicio.',
        ],
        [
          'Porque UDP deja de ser transporte cuando lleva una IP',
          'UDP mantiene su función al transportar los mensajes DNS.',
        ],
      ],
      'Clasifica el servicio, no solo la información que contiene su respuesta. Una aplicación puede entregar información usada por otra capa.',
      'Una oficina puede darte una dirección sin conducir el vehículo hasta ella.',
      ['dns'],
    ),
    probe(
      'proof-dns-4',
      4,
      'Un mensaje DNS va dentro de un datagrama UDP. ¿Qué responsabilidad pertenece a UDP en ese intercambio?',
      [
        [
          'Llevar el datagrama entre procesos usando información de transporte',
          'UDP ofrece transporte mediante datagramas y puertos.',
        ],
        [
          'Interpretar qué IP corresponde al nombre consultado',
          'El significado de la consulta y respuesta corresponde a DNS.',
        ],
        [
          'Garantizar por sí solo que el nombre existe',
          'UDP no define los nombres ni el contenido de la respuesta DNS.',
        ],
        [
          'Convertir la consulta DNS en una señal física',
          'La señalización pertenece al medio físico, no al servicio UDP.',
        ],
      ],
      'DNS define el servicio; UDP ofrece su transporte. Entender quién hace cada trabajo evita clasificarlos por el mero hecho de viajar juntos.',
      'El repartidor y la oficina que responde a la consulta hacen trabajos distintos.',
      ['udp', 'dns'],
    ),
  ],
  addressing: [
    probe(
      'proof-address-3',
      2,
      'Tu equipo envía un paquete a un servidor de otra red a través de su router. ¿Qué MAC suele usar como destino en su Ethernet local?',
      [
        [
          'La MAC del siguiente salto del enlace, normalmente el router',
          'La trama local debe alcanzar el nodo que continúa el recorrido.',
        ],
        [
          'Necesariamente la MAC del servidor remoto en cualquier parte de Internet',
          'El servidor remoto no tiene que ser un nodo de ese enlace local.',
        ],
        [
          'El número del puerto TCP 443 convertido a MAC',
          'Los puertos lógicos no se convierten en direcciones MAC.',
        ],
        [
          'Una MAC idéntica al nombre DNS del servidor',
          'Un nombre DNS y una MAC representan datos distintos.',
        ],
      ],
      'La MAC sirve a la entrega del enlace actual. La IP identifica el destino de red y el puerto distingue el proceso o servicio.',
      'La primera entrega puede ser al router, aunque la carta termine lejos.',
      ['ethernet', 'ip'],
    ),
    probe(
      'proof-address-4',
      4,
      'En el destino 192.0.2.10:443 de una conexión TCP, ¿qué indica 443?',
      [
        [
          'Un puerto lógico del transporte para distinguir el servicio',
          'El número pertenece al ámbito lógico TCP; no describe una toma física.',
        ],
        ['La toma de cable número 443 del servidor', 'Un puerto TCP no es un conector del equipo.'],
        [
          'La dirección MAC de toda la conexión',
          'Una MAC tiene un formato y una función de enlace diferentes.',
        ],
        [
          'La potencia de la señal de radio recibida',
          'Un número de puerto no mide la señal física.',
        ],
      ],
      'Distingue la IP del equipo y el puerto TCP del proceso. Compartir la palabra «puerto» con un conector no los hace equivalentes.',
      'Edificio y puerta interior son identificadores distintos.',
      ['tcp'],
    ),
  ],
  'session-login': [
    probe(
      'proof-session-3',
      4,
      'Alguien habla de una «sesión TCP». ¿Qué clasificación conserva el protocolo TCP?',
      [
        [
          'Transporte: el nombre informal no cambia su función',
          'TCP mantiene su servicio de transporte fiable y ordenado.',
        ],
        [
          'Sesión OSI siempre, porque se ha usado esa palabra',
          'Una palabra cotidiana no sustituye el análisis funcional.',
        ],
        [
          'Aplicación exclusivamente, porque mantiene estado',
          'Mantener estado no basta para convertir TCP en un servicio de aplicación.',
        ],
        [
          'Presentación, porque puede llevar una contraseña',
          'Transportar datos no convierte TCP en la función que interpreta su representación.',
        ],
      ],
      'Los nombres cotidianos pueden referirse a conexiones o estados. Para OSI analiza la función que presta TCP.',
      'Clasifica por trabajo y no por el nombre de la conversación.',
      ['tcp'],
    ),
    probe(
      'proof-session-4',
      5,
      'TCP/IP agrupa normalmente funciones OSI de sesión dentro de aplicación. ¿Qué significa?',
      [
        [
          'Que esa coordinación puede seguir existiendo sin una capa 5 separada',
          'El modelo puede agrupar funciones que los sistemas siguen necesitando.',
        ],
        [
          'Que nadie puede ya coordinar un diálogo',
          'Agrupar no elimina la responsabilidad de los sistemas reales.',
        ],
        [
          'Que toda contraseña pasa automáticamente a ser un protocolo OSI de sesión',
          'Autenticar cuentas sigue siendo una operación concreta de la aplicación.',
        ],
        [
          'Que una MAC sustituye todos los puntos de sincronización',
          'La dirección local no realiza la coordinación del diálogo.',
        ],
      ],
      'Un modelo divide responsabilidades de una manera. Otro puede agruparlas sin que desaparezcan de las aplicaciones reales.',
      'Varios oficios pueden trabajar en una misma oficina.',
      ['osi'],
    ),
  ],
  'compression-security': [
    probe(
      'proof-compress-3',
      6,
      'Comprimes un documento y alguien puede abrirlo sin ninguna clave. ¿Qué ilustra?',
      [
        [
          'Que reducir la representación no implica mantener secreto el contenido',
          'La compresión no exige confidencialidad ni una clave secreta.',
        ],
        [
          'Que cualquier compresión cifra todos los datos',
          'El lector puede descomprimir sin una clave secreta; compresión y cifrado son distintos.',
        ],
        [
          'Que TCP decide el formato comprimido',
          'TCP trata el flujo de bytes sin elegir el formato del documento.',
        ],
        [
          'Que cambiar la MAC protege el documento frente a lectores',
          'Una dirección de enlace no cifra el contenido del documento.',
        ],
      ],
      'Un fichero pequeño puede seguir siendo legible por cualquiera. La representación y la protección del contenido tienen objetivos diferentes.',
      'Reducir el equipaje no equivale a cerrarlo con llave.',
      ['osi'],
    ),
    probe(
      'proof-compress-4',
      6,
      'El receptor recibe todos los bytes, pero interpreta mal la codificación del texto. ¿Qué diferencia aparece?',
      [
        [
          'La entrega puede funcionar mientras falla la interpretación de los datos',
          'Recibir bytes y entender su representación son responsabilidades diferentes.',
        ],
        [
          'Si el texto se ve mal, TCP no entregó ningún byte necesariamente',
          'Puede haberse entregado el contenido completo y usarse una codificación incorrecta.',
        ],
        [
          'La codificación de texto determina la ruta IP',
          'La representación no elige los saltos de encaminamiento.',
        ],
        [
          'Comprimir el texto garantiza que el lector lo interprete siempre',
          'La compresión no resuelve automáticamente el acuerdo de codificación.',
        ],
      ],
      'Presentación ayuda a modelar cómo se representa e interpreta el contenido. No sustituye la entrega de transporte ni obliga a una capa separada en Internet.',
      'Puede llegar una carta completa y estar escrita con un código que no entiendes.',
      ['osi'],
    ),
  ],
  'connectivity-service': [
    probe(
      'proof-health-3',
      7,
      'Una web responde HTTP 404. ¿Qué sabes de esa petición?',
      [
        [
          'Recibiste una respuesta de un participante HTTP sobre ese recurso',
          'El código observado es evidencia de una respuesta del servicio de aplicación.',
        ],
        ['No llegó ninguna respuesta en ninguna capa', 'El propio 404 es información recibida.'],
        [
          'Todos los equipos del recorrido funcionan sin ningún problema',
          'Una respuesta no verifica exhaustivamente todos los equipos ni funciones.',
        ],
        ['El cable está roto con seguridad', 'El 404 no es una prueba de rotura física.'],
      ],
      'Un error del recurso sigue siendo una respuesta. Interpreta esa evidencia sin concluir que toda la infraestructura esté perfecta o rota.',
      'La ventanilla puede responder que no dispone de lo solicitado.',
      ['http'],
    ),
    probe(
      'proof-health-4',
      3,
      'Un destino no responde a ping. ¿Qué interpretación evita una conclusión precipitada?',
      [
        [
          'Puede haber varias causas; necesito más pruebas para localizar el problema',
          'El filtrado, el estado del destino o la conectividad pueden influir.',
        ],
        [
          'El cable de mi equipo está roto siempre',
          'La ausencia de ICMP no localiza necesariamente el fallo físico.',
        ],
        ['La web del destino no existe con certeza', 'Ping no verifica el recurso de aplicación.'],
        [
          'DNS ha rechazado siempre el nombre, incluso si usé una IP',
          'Usar una IP para esa prueba no requiere resolver un nombre en ese momento.',
        ],
      ],
      'La prueba comprueba un intercambio concreto. Su silencio no demuestra de manera única una avería, y conviene combinar evidencias.',
      'Una persona que no responde a una llamada puede estar ocupada; no prueba que la línea esté rota.',
      ['icmp'],
    ),
  ],
};
