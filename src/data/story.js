function question(id, layer, prompt, correct, wrong, explanation, hint) {
  return {
    id: `home-${id}`,
    layer,
    prompt,
    choices: [correct, ...wrong],
    correctIndex: 0,
    explanation,
    hint,
    difficulty: 'normal',
    type: 'story',
    layerQuestion: false,
  };
}
export const storyChapters = [
  {
    id: 'cable',
    title: 'Una casa que empieza a conectar',
    part: 'Primer enlace',
    symbol: '↔',
    mission: 'Conecta tu portátil al equipo de red y comprueba que hay señal.',
    scene:
      'Acabas de mudarte. Tu portátil y el router están encendidos, pero el cable está suelto. Antes de configurar nada, necesitas un camino por el que puedan viajar los bits.',
    lesson:
      'Un cable de cobre transporta señales eléctricas; la fibra usa luz y Wi-Fi usa radio. Esta función es Física, capa 1. Tener señal es el primer paso: aún no demuestra que puedas abrir una web.',
    analogy:
      'Como una carretera: primero debe existir el camino. Después harán falta direcciones y un destino.',
    build: 'Tu portátil ya tiene un primer enlace físico.',
    unlocks: ['order', 'function'],
    relatedLayers: [1],
    questions: [
      question(
        'cable-1',
        1,
        'El cable está suelto. ¿Qué haces primero?',
        'Conectarlo y comprobar que hay señal',
        ['Cambiar el servidor DNS', 'Crear una cuenta en una web', 'Comprimir todos los archivos'],
        'Sin medio o señal no puede empezar el intercambio por ese enlace. La conexión física viene antes de resolver nombres o usar una web.',
        'Piensa en el camino que deben recorrer los bits.',
      ),
      question(
        'cable-2',
        1,
        'En el cable de cobre, ¿cómo viajan los bits?',
        'Como señales eléctricas',
        [
          'Como nombres de páginas web',
          'Como números de puerto visibles',
          'Como cuentas de usuario',
        ],
        'La capa física representa bits mediante señales. No decide qué web quieres visitar.',
        '¿Qué puede transmitir físicamente un cable de cobre?',
      ),
      question(
        'cable-3',
        1,
        'Se enciende el indicador de enlace. ¿Qué has comprobado?',
        'Que existe un enlace físico; falta comprobar los servicios',
        [
          'Que todas las webs funcionan',
          'Que DNS ya respondió correctamente',
          'Que la comunicación web está cifrada',
        ],
        'Una señal de enlace es una prueba limitada. Después investigarás direcciones, transporte y servicios.',
        'Una carretera abierta no garantiza que tu tienda esté abierta.',
      ),
    ],
  },
  {
    id: 'wifi',
    title: 'Dale sitio a tu móvil',
    part: 'Red local y Wi-Fi',
    symbol: '⌁',
    mission: 'Añade tu móvil a la red local y distingue señal de entrega local.',
    scene:
      'El portátil ya tiene cable. Ahora conectas el móvil por Wi-Fi. Los dos dispositivos comparten tu red doméstica, aunque usan medios distintos.',
    lesson:
      'Wi-Fi incluye señal de radio (capa 1) y reglas de acceso y entrega local mediante tramas (capa 2). Las direcciones MAC ayudan a identificar interfaces en ese enlace. Un punto de acceso conecta el tramo inalámbrico con la red local.',
    analogy:
      'Dentro de un edificio necesitas saber a qué puerta llevar un paquete. Esa entrega cercana se distingue del viaje entre ciudades.',
    build: 'Tu casa ya tiene dispositivos conectados en una red local.',
    unlocks: ['matching'],
    relatedLayers: [1, 2],
    questions: [
      question(
        'wifi-1',
        1,
        'Tu móvil se aleja demasiado y pierde la señal Wi-Fi. ¿Qué función falla primero?',
        'La transmisión por radio, capa física',
        [
          'Resolver un nombre mediante DNS',
          'Elegir un puerto TCP',
          'Solicitar una página con HTTP',
        ],
        'Una señal demasiado débil afecta al medio de transmisión. Wi-Fi también tiene funciones de enlace, pero aquí el síntoma describe la radio.',
        'Céntrate en la señal, no en todos los componentes de Wi-Fi.',
      ),
      question(
        'wifi-2',
        2,
        'Una trama debe llegar a una interfaz en tu red local. ¿Qué dirección encaja?',
        'Una dirección MAC para ese enlace',
        [
          'El nombre de usuario de una web',
          'Un puerto de la aplicación',
          'El nombre de un documento',
        ],
        'La dirección MAC se usa en funciones de enlace. No sustituye a las direcciones IP para el recorrido entre redes.',
        'Busca una identificación de la interfaz en la entrega local.',
      ),
      question(
        'wifi-3',
        2,
        '¿Por qué no conviene decir que Wi-Fi es solo capa 1?',
        'Porque también organiza el acceso y las tramas del enlace',
        [
          'Porque Wi-Fi sustituye a DNS',
          'Porque Wi-Fi es un servicio HTTP',
          'Porque Wi-Fi elimina los puertos',
        ],
        'Wi-Fi abarca funciones físicas y de enlace. Clasificas una función concreta, no todo un producto con una sola etiqueta.',
        'Además de emitir radio, ¿cómo se organiza la conversación local?',
      ),
    ],
  },
  {
    id: 'router',
    title: 'Abre la puerta hacia otras redes',
    part: 'Router y direcciones',
    symbol: '⇄',
    mission: 'Distingue la dirección del dispositivo y la puerta de enlace.',
    scene:
      'Tu móvil puede comunicarse en casa. Para llegar a un servidor de otra red necesita una dirección IP y saber dónde está su puerta de salida. Tu router doméstico suele reunir varias funciones en una sola caja.',
    lesson:
      'IP identifica destinos y participa en el encaminamiento entre redes, capa 3. La puerta de enlace permite salir de la red local. DHCP puede proporcionar configuración como dirección, máscara y puerta de enlace; es un servicio de aplicación, aunque configure IP.',
    analogy:
      'Tu dirección indica dónde estás. La salida de la urbanización permite dirigirte a otros barrios: dirección propia y puerta de salida cumplen papeles diferentes.',
    build: 'La red doméstica tiene una salida hacia otras redes.',
    unlocks: ['scenario'],
    relatedLayers: [3, 7],
    questions: [
      question(
        'router-1',
        3,
        'El destino está fuera de tu red local. ¿A quién envías el primer salto?',
        'A la puerta de enlace apropiada',
        [
          'Al nombre de usuario del servidor',
          'Siempre a la MAC remota del servidor',
          'A cualquier puerto del móvil',
        ],
        'La puerta de enlace recibe el primer salto local y el router decide cómo continuar hacia otra red.',
        'Busca la salida de tu red, no el destino final de todo el viaje.',
      ),
      question(
        'router-2',
        3,
        '¿Qué función de tu router corresponde a la capa de red?',
        'Encaminar paquetes IP entre redes',
        [
          'Cifrar por sí solo todas las webs',
          'Convertir todo nombre en una MAC',
          'Comprimir todas las imágenes',
        ],
        'Encaminar paquetes entre redes es una función de capa 3. La caja doméstica puede además ofrecer Wi-Fi, conmutación y servicios.',
        'Clasifica el trabajo de encaminamiento.',
      ),
      question(
        'router-3',
        7,
        'DHCP entrega configuración IP. ¿Qué describes al clasificar DHCP?',
        'Un servicio de aplicación que configura la red',
        ['Una señal eléctrica del cable', 'El cifrado de una web', 'Una trama Ethernet sin datos'],
        'El contenido que configura un servicio no determina su capa. DHCP es un protocolo de aplicación que puede proporcionar parámetros IP.',
        'Distingue el servicio de configuración y el parámetro que entrega.',
      ),
    ],
  },
  {
    id: 'dns',
    title: 'Pon nombres a tus destinos',
    part: 'Resolución DNS',
    symbol: 'Aa',
    mission: 'Resuelve un nombre antes de solicitar el servicio.',
    scene:
      'Ya tienes conexión y dirección. Escribes un nombre como aprender.example en el navegador. El cliente necesita consultar DNS para obtener la información de dirección adecuada antes de intentar esa conexión.',
    lesson:
      'DNS es un servicio de aplicación, capa 7. Sus mensajes viajan usando un transporte; DNS puede usar UDP o TCP, entre otras variantes. Que la respuesta contenga una IP no convierte la función DNS en capa 3.',
    analogy:
      'Es tu agenda: buscas una persona por su nombre para obtener su número. Encontrar el número no garantiza que te atienda cuando llames.',
    build: 'Tu red puede encontrar destinos por su nombre.',
    unlocks: ['protocol'],
    relatedLayers: [7, 4],
    questions: [
      question(
        'dns-1',
        7,
        'Quieres encontrar la dirección asociada a un nombre. ¿Qué servicio consultas?',
        'DNS',
        [
          'HTTP para el formato de imágenes',
          'Ethernet para abrir una cuenta',
          'TCP para traducir todos los nombres',
        ],
        'DNS permite consultar información asociada a nombres. Después el cliente podrá intentar usar el servicio de destino.',
        'Piensa en la agenda de nombres.',
      ),
      question(
        'dns-2',
        7,
        'Una respuesta DNS contiene una IP. ¿En qué capa clasificas la función DNS?',
        'Aplicación: proporciona el servicio de nombres',
        [
          'Red: cualquier cosa que mencione una IP',
          'Física: porque utiliza señales',
          'Enlace: porque responde una trama',
        ],
        'Se clasifica por la función del protocolo. DNS sigue siendo un servicio de aplicación aunque devuelva información de dirección.',
        '¿Qué servicio está prestando, más allá del dato que devuelve?',
      ),
      question(
        'dns-3',
        7,
        'DNS responde correctamente, pero la web falla. ¿Qué concluyes?',
        'La consulta de nombres funcionó; falta comprobar la web',
        [
          'Todo el intercambio web está bien',
          'El contenido necesariamente está cifrado',
          'El servidor no puede tener ningún fallo',
        ],
        'Resolver un nombre y prestar una web son servicios distintos. Una prueba válida no comprueba toda la comunicación.',
        'Tener el número de teléfono no implica que te atiendan.',
      ),
    ],
  },
  {
    id: 'web',
    title: 'Lleva una petición hasta la web',
    part: 'HTTP y transporte',
    symbol: '→',
    mission: 'Separa el servicio web, el transporte y el proceso de destino.',
    scene:
      'Para este ejemplo de HTTP sin TLS, el navegador prepara una petición y la envía usando TCP. Las funciones de transporte, red, enlace y física colaboran para entregarla.',
    lesson:
      'HTTP solicita un recurso: Aplicación, capa 7. TCP ofrece un flujo fiable y ordenado: Transporte, capa 4. Un puerto ayuda a dirigir los datos al proceso correspondiente. IP aporta el recorrido entre redes y el enlace entrega cada salto local.',
    analogy:
      'Pides un libro en una biblioteca. La solicitud dice qué quieres; el servicio de reparto organiza la entrega. El número de ventanilla distingue quién debe recibirlo.',
    build: 'Tu casa ya puede solicitar un servicio web y reconocer sus envolturas.',
    unlocks: ['packet', 'cases'],
    relatedLayers: [7, 4, 3, 2, 1],
    questions: [
      question(
        'web-1',
        7,
        'En este ejemplo, ¿qué protocolo expresa la petición de una página?',
        'HTTP',
        [
          'IP como formato de la página',
          'Ethernet como servicio web',
          'TCP como lenguaje de documentos',
        ],
        'HTTP define mensajes para el servicio web. Los demás protocolos hacen posible transportar esos mensajes.',
        'Identifica la solicitud del servicio que quiere el usuario.',
      ),
      question(
        'web-2',
        4,
        '¿Qué aporta TCP a esta petición?',
        'Un flujo de bytes fiable y ordenado',
        [
          'Cifrado automático del contenido',
          'Traducción de todos los nombres',
          'La señal de radio del móvil',
        ],
        'TCP se encarga de funciones de transporte. Su fiabilidad no significa confidencialidad.',
        'Separa entregar bien de proteger el contenido.',
      ),
      question(
        'web-3',
        4,
        'La IP identifica un destino. ¿Para qué sirve el puerto de destino?',
        'Para dirigir la comunicación al proceso correspondiente',
        [
          'Para identificar el cable físico',
          'Para comprimir el documento',
          'Para reemplazar la dirección IP',
        ],
        'Los puertos forman parte de la comunicación de transporte y ayudan a distinguir los procesos o servicios.',
        'Un edificio tiene una dirección; dentro, cada ventanilla atiende una función.',
      ),
    ],
  },
  {
    id: 'security',
    title: 'Protege y entiende la conversación',
    part: 'Protección y formatos',
    symbol: '◇',
    mission: 'Distingue entrega, protección, representación y gestión del diálogo.',
    scene:
      'Quieres entrar en una web con HTTPS. Además de entregar datos necesitas protección. Y ambos extremos deben entender la representación de la información y mantener una conversación coherente.',
    lesson:
      'TLS protege comunicaciones como HTTPS; no debe atribuirse ese cifrado a TCP. En OSI, Presentación (6) describe representación de datos y Sesión (5), gestión del diálogo y sincronización. Son funciones conceptuales: TLS o una cuenta de usuario no se asignan enteros y automáticamente a una única capa.',
    analogy:
      'Puedes entregar una carta sin abrirla, escribirla en un idioma acordado y retomar una charla donde la dejaste. Son tres necesidades distintas.',
    build: 'Tu red distingue entrega, protección, representación y diálogo.',
    unlocks: ['confusions', 'adaptive', 'flashcards'],
    relatedLayers: [4, 5, 6, 7],
    questions: [
      question(
        'security-1',
        7,
        'Quieres proteger una petición web. ¿Qué opción encaja?',
        'HTTPS usando TLS',
        [
          'HTTP porque TCP ya cifra',
          'HTTP con una IP distinta como único cambio',
          'HTTP con un puerto nuevo como único cambio',
        ],
        'HTTPS usa TLS para proteger la comunicación. Cambiar dirección o puerto no vuelve cifrado el contenido de HTTP. TLS no se reduce a una sola capa conceptual.',
        'Busca protección de la comunicación, no solo entrega fiable.',
      ),
      question(
        'security-2',
        6,
        'Los extremos deben adaptar la representación de un texto. ¿Qué función OSI reconoces?',
        'Presentación',
        [
          'Encaminamiento de paquetes entre redes',
          'Entrega de una trama local',
          'Conversión de bits en señales',
        ],
        'Presentación describe cómo se representa la información, como formatos y codificación. OSI sirve para distinguir funciones.',
        'Piensa en acordar un idioma o un formato.',
      ),
      question(
        'security-3',
        5,
        'Dos sistemas retoman el diálogo desde un punto de sincronización. ¿Qué función OSI encaja?',
        'Sesión',
        [
          'Resolver un nombre de dominio',
          'Elegir la siguiente ruta IP',
          'Detectar una señal de radio débil',
        ],
        'Gestión del diálogo y sincronización son funciones conceptuales de Sesión. No equivalen a cualquier inicio de sesión de una web.',
        'La pregunta describe cómo se coordina una conversación.',
      ),
    ],
  },
  {
    id: 'ready',
    title: 'Tu casa, capa a capa',
    part: 'Red completa',
    symbol: '✓',
    mission: 'Diagnostica con pruebas y conecta las siete funciones.',
    scene:
      'Tu casa tiene un enlace, red local, direcciones, salida, nombres y servicios. Ahora comprueba qué funciona antes de cambiar configuraciones al azar.',
    lesson:
      'OSI se recorre de 7 a 1 al preparar un envío y de 1 a 7 al interpretar la recepción. No son siete programas independientes. Una web con problemas puede fallar en diferentes funciones; una prueba solo demuestra lo que prueba.',
    analogy:
      'Si no llega una entrega, compruebas el camino, la dirección, la ventanilla y el servicio. No cambias todo el edificio por una sola pista.',
    build: '¡Tu red doméstica está construida! Puedes practicar sus funciones de varias maneras.',
    unlocks: ['exam', 'survival', 'duel'],
    relatedLayers: [1, 2, 3, 4, 5, 6, 7],
    questions: [
      question(
        'ready-1',
        0,
        'Al preparar un envío según OSI, ¿qué recorrido sigues?',
        'De Aplicación (7) a Física (1)',
        [
          'Siempre de Física (1) a Aplicación (7)',
          'Saltas siempre Transporte y Red',
          'Todas las funciones se vuelven DNS',
        ],
        'Al enviar, los datos se preparan desde servicios de aplicación hacia la transmisión física. La recepción se describe en el sentido contrario.',
        'Empieza en lo que solicita el usuario y termina en la señal.',
      ),
      question(
        'ready-2',
        7,
        'La web devuelve un error HTTP. ¿Qué prueba esa respuesta?',
        'Que recibiste una respuesta del servicio HTTP; hay que interpretar el error',
        [
          'Que el cable está necesariamente roto',
          'Que DNS nunca pudo funcionar',
          'Que TCP cifra el contenido',
        ],
        'La respuesta HTTP aporta evidencia de aplicación. No concluyas que todo está correcto ni que se ha roto la señal física.',
        'Clasifica la evidencia que realmente recibiste.',
      ),
      question(
        'ready-3',
        0,
        '¿Para qué te sirve OSI al investigar tu red?',
        'Para distinguir funciones y acotar qué conviene comprobar',
        [
          'Para afirmar que cada caja realiza una sola capa',
          'Para sustituir todas las pruebas con una etiqueta',
          'Para garantizar que Wi-Fi siempre da Internet',
        ],
        'OSI ayuda a razonar. Equipos y protocolos reales pueden abarcar varias funciones; necesitas observar y comprobar.',
        'Busca una herramienta para pensar, no una garantía automática.',
      ),
    ],
  },
];
export const storyById = new Map(storyChapters.map((chapter) => [chapter.id, chapter]));
export const storyQuestions = storyChapters.flatMap((chapter) => chapter.questions);
