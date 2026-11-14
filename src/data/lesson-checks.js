// One applied situation per lesson. Distractors describe nearby, real misconceptions.
// Reasons follow the authored choice order; the view may shuffle that order.
export const lessonChecks = {
  basics: {
    prompt:
      'Al estudiar una web, separas pedir el recurso, dirigir paquetes y transmitir señales. ¿Qué estás haciendo con OSI?',
    choices: [
      'Asignar cada tarea a un programa independiente que debe instalarse.',
      'Separar responsabilidades que colaboran en una misma comunicación.',
      'Enumerar tres viajes completos que el mensaje realiza por separado.',
      'Ordenar los protocolos según cuál se ejecutó primero en el equipo.',
    ],
    correctIndex: 1,
    reasons: [
      'Una capa es una responsabilidad del modelo, no un programa obligatorio. En los protocolos reales varias funciones pueden combinarse.',
      'Pedir un recurso, encaminar paquetes y transmitir señales son responsabilidades distintas que colaboran.',
      'Las capas colaboran para transportar el mensaje; no representan viajes independientes por la red.',
      'La numeración organiza responsabilidades. No es una cronología de arranque ni de ejecución de programas.',
    ],
    explanation:
      'OSI organiza funciones: HTTP expresa la petición, IP permite encaminar y el medio físico transmite señales. Es un mapa para entender y diagnosticar.',
  },
  addresses: {
    prompt:
      'Una misma IP atiende dos servicios TCP, en los puertos 443 y 8443. ¿Qué distingue el servicio destinatario?',
    choices: [
      'La dirección MAC del siguiente salto en la red local.',
      'La dirección IP de destino compartida por los servicios.',
      'El puerto temporal que el cliente usa como origen.',
      'El puerto TCP de destino indicado por el cliente.',
    ],
    correctIndex: 3,
    reasons: [
      'La MAC dirige la trama a una interfaz del enlace, por ejemplo el router. No selecciona un servicio TCP remoto.',
      'Ambos servicios comparten esa IP. Hace falta distinguir el destino dentro del equipo mediante un puerto.',
      'El puerto de origen ayuda a distinguir la comunicación del cliente y recibir respuestas; no elige entre los dos servicios del servidor.',
      'El puerto de destino permite distinguir esos servicios TCP aunque compartan dirección IP.',
    ],
    explanation:
      'MAC: interfaz del enlace. IP: destino entre redes. Puerto de destino: servicio receptor. Una comunicación TCP combina direcciones y puertos de ambos extremos.',
  },
  tcpip: {
    prompt:
      'Tu aplicación representa datos, coordina el diálogo y solicita un recurso. ¿Dónde agrupa TCP/IP de cuatro capas estas funciones de OSI 6, 5 y 7?',
    choices: [
      'En Aplicación, sin exigir tres capas separadas en la implementación.',
      'En Transporte, junto a la entrega entre procesos y los puertos.',
      'En Internet, junto al direccionamiento y las rutas de los paquetes.',
      'En Acceso a la red, junto a las tramas y las señales del enlace.',
    ],
    correctIndex: 0,
    reasons: [
      'La comparación habitual agrupa las funciones de OSI 5, 6 y 7 en Aplicación TCP/IP.',
      'Transporte corresponde a OSI 4. Entregar datos entre procesos no equivale a interpretar su representación o expresar el servicio.',
      'Internet corresponde aproximadamente a OSI 3: direccionamiento y encaminamiento, no las funciones del diálogo y del servicio.',
      'Acceso a la red agrupa OSI 1 y 2. Describe la entrega local y el medio, no el servicio de aplicación.',
    ],
    explanation:
      'La correspondencia habitual es: OSI 7–5 → Aplicación; 4 → Transporte; 3 → Internet; 2–1 → Acceso a la red. Es una comparación de funciones, no de programas.',
  },
  encapsulation: {
    prompt:
      'En una comunicación HTTP sobre TCP, IPv4 y Ethernet, ¿qué orden describe el contenido desde la envoltura exterior hasta los datos?',
    choices: [
      'Trama Ethernet → segmento TCP → paquete IPv4 → datos HTTP.',
      'Paquete IPv4 → trama Ethernet → segmento TCP → datos HTTP.',
      'Trama Ethernet → paquete IPv4 → segmento TCP → datos HTTP.',
      'Trama Ethernet → paquete IPv4 → datos HTTP → segmento TCP.',
    ],
    correctIndex: 2,
    reasons: [
      'TCP se transporta dentro de IP. Invertir paquete y segmento atribuye a Transporte la envoltura que corresponde a Red.',
      'Para ese enlace, la trama contiene el paquete IP. IP no contiene la trama que lo lleva por Ethernet.',
      'Ethernet envuelve IP, IP transporta TCP y TCP transporta los datos de este intercambio HTTP.',
      'En este ejemplo TCP transporta los datos HTTP; HTTP no contiene el segmento que lo lleva.',
    ],
    explanation:
      'Las unidades se anidan: trama → paquete → segmento → datos. Al recibir se interpretan esas envolturas; al cambiar de enlace se prepara una nueva trama.',
  },
  troubleshoot: {
    prompt:
      'Un ping a una IP no recibe respuesta, pero esa misma IP responde a una petición HTTP. ¿Qué conclusión respalda la comparación?',
    choices: [
      'El destino no es accesible por ningún protocolo de red.',
      'La prueba ICMP falló, pero hubo un intercambio HTTP con ese destino.',
      'El fallo de resolución DNS explica que el ping por IP no responda.',
      'La respuesta HTTP demuestra que el destino debe aceptar también ICMP.',
    ],
    correctIndex: 1,
    reasons: [
      'La respuesta HTTP es evidencia de un intercambio con ese destino. El resultado del ping no invalida esa observación.',
      'Son pruebas de protocolos distintos: una puede fallar mientras la otra obtiene respuesta.',
      'La prueba usa una IP, no un nombre que haya que resolver. Ese dato no respalda un diagnóstico DNS.',
      'Un destino puede responder HTTP y filtrar ICMP o no contestarlo. Una prueba no garantiza el resultado de otra.',
    ],
    explanation:
      'Un ping sin respuesta no identifica por sí solo una avería. Compara protocolos y observa qué comprobó cada prueba antes de concluir.',
  },
  url: {
    prompt:
      'DNS resuelve el nombre y la petición de una página devuelve HTTP 404. ¿Qué evidencia tienes para esa petición?',
    choices: [
      'El nombre se resolvió, pero no se llegó a intercambiar HTTP.',
      'Se intercambió HTTP, así que el recurso solicitado está disponible.',
      'Respondió un participante HTTP sin ofrecer el recurso solicitado.',
      'Se recibió un 404 porque DNS no encontró una dirección para el nombre.',
    ],
    correctIndex: 2,
    reasons: [
      'Un código 404 forma parte de una respuesta HTTP. Sí hubo ese intercambio, aunque no se obtuviera el recurso.',
      'Recibir una respuesta no equivale a obtener el recurso: 404 indica que no se encuentra o que no se quiere revelar su existencia.',
      'El 404 confirma una respuesta HTTP para esa petición, no el éxito de obtener el recurso.',
      'La situación ya dice que DNS resolvió. Un 404 es una respuesta HTTP, no una respuesta de resolución DNS.',
    ],
    explanation:
      'Distingue resolver el nombre, establecer comunicación y obtener un recurso. Un 404 aporta evidencia del intercambio HTTP, incluso si responde un intermediario.',
  },
  wifi: {
    prompt:
      'Hay buena señal Wi-Fi y una descarga lenta. ¿Qué comparación ayuda a separar el tramo inalámbrico de otros posibles límites?',
    choices: [
      'Repetir la misma descarga por cable, con el mismo equipo y servidor.',
      'Cambiar el servidor DNS y medir si aumentan las barras de señal.',
      'Contratar más capacidad antes de comparar el enlace local.',
      'Reiniciar el router y cambiar de banda y DNS en la misma prueba.',
    ],
    correctIndex: 0,
    reasons: [
      'Mantener equipo y servidor y cambiar el enlace permite acotar mejor el tramo inalámbrico, aunque no identifica una causa única.',
      'DNS resuelve nombres; las barras estiman señal de radio. No miden si DNS funciona ni la tasa de transferencia.',
      'La capacidad contratada podría ser un límite, pero los datos aún no lo distinguen de Wi-Fi, congestión o servidor.',
      'Cambiar varias variables a la vez impide saber qué cambio influyó. Haz comparaciones controladas.',
    ],
    explanation:
      'Buena señal no garantiza una descarga rápida. Compara una variable cada vez: si por cable mejora, investiga el tramo Wi-Fi sin dar por demostrada una causa concreta.',
  },
  'home-network': {
    prompt:
      'DHCP entrega IP, máscara, puerta de enlace y DNS a tu equipo. ¿Qué distingue su trabajo del trabajo de IP?',
    choices: [
      'DHCP encamina los paquetes porque entrega una puerta de enlace.',
      'DHCP sustituye al servicio DNS porque informa qué servidor usar.',
      'DHCP conmuta tramas porque puede identificar al cliente mediante MAC.',
      'DHCP proporciona configuración; IP direcciona y permite encaminar.',
    ],
    correctIndex: 3,
    reasons: [
      'Indicar qué puerta de enlace usar no es reenviar paquetes. Esa decisión de encaminamiento corresponde a la función de red.',
      'Informar la dirección de un servidor DNS no es resolver nombres. Son servicios de aplicación diferentes.',
      'Usar información de enlace para identificar un cliente no convierte el servicio de configuración en conmutación de tramas.',
      'DHCP ofrece configuración como servicio de aplicación; IP realiza el trabajo de la capa de red.',
    ],
    explanation:
      'Clasifica el protocolo por su función. DHCP es de Aplicación aunque entregue parámetros IP; una caja doméstica puede reunir ese servicio y el router.',
  },
  speed: {
    prompt:
      'Tu conexión anuncia 100 Mb/s y una descarga marca 12 MB/s. Antes de sobrecargas, ¿qué comparación de unidades es correcta?',
    choices: [
      '12 MB/s son 12 Mb/s: la descarga usa alrededor del 12 %.',
      '12 MB/s son 96 Mb/s: la descarga está cerca del límite anunciado.',
      '12 MB/s son 1,5 Mb/s: la descarga usa alrededor del 1,5 %.',
      '100 Mb/s son 100 MB/s: faltan 88 MB/s para el límite anunciado.',
    ],
    correctIndex: 1,
    reasons: [
      'La B mayúscula indica bytes y la b minúscula bits. No son la misma unidad: un byte contiene ocho bits.',
      '12 megabytes por segundo multiplicados por ocho son 96 megabits por segundo.',
      'Al pasar de bytes a bits multiplicas por ocho, no divides. Divides al convertir en el sentido contrario.',
      '100 Mb/s equivalen a 12,5 MB/s teóricos, no a 100 MB/s. La descarga de 12 MB/s está cerca de esa cifra.',
    ],
    explanation:
      'Lee la unidad antes de comparar: 1 byte = 8 bits. 100 Mb/s → 12,5 MB/s; 12 MB/s → 96 Mb/s. El rendimiento útil puede ser menor por sobrecargas y otros límites.',
  },
  security: {
    prompt:
      'Una aplicación envía datos por TCP, sin TLS ni otro mecanismo de cifrado. ¿Qué propiedad aporta TCP por sí mismo?',
    choices: [
      'Confidencialidad del contenido gracias a sus confirmaciones.',
      'Autenticación del servidor gracias a los números de puerto.',
      'Entrega fiable y ordenada, sin cifrado del contenido.',
      'Protección hasta el servidor gracias a la contraseña de Wi-Fi.',
    ],
    correctIndex: 2,
    reasons: [
      'Las confirmaciones permiten controlar la entrega; no ocultan el contenido. Fiabilidad y confidencialidad son propiedades distintas.',
      'Un puerto distingue comunicaciones con procesos; no acredita la identidad de un servidor como lo haría una validación de certificado.',
      'TCP aporta un flujo fiable y ordenado. Cifrar el contenido requiere otro mecanismo.',
      'La protección Wi-Fi pertenece al tramo inalámbrico. No es una propiedad de TCP ni protege por sí sola todo el recorrido hasta el servidor.',
    ],
    explanation:
      'TCP organiza la entrega; TLS puede proteger la comunicación y autenticar al servidor con las comprobaciones adecuadas. La protección del Wi-Fi tiene una cobertura distinta.',
  },
  'browser-errors': {
    prompt:
      'Una web devuelve HTTP 503, pero otras funcionan. ¿Qué siguiente paso conserva lo que sabes y ayuda a investigar?',
    choices: [
      'Comparar recursos y disponibilidad de ese servicio antes de cambiar ajustes.',
      'Cambiar DNS para obtener la IP de una web que ya ha devuelto la respuesta.',
      'Cambiar la puerta de enlace sin comparar otros recursos de ese servicio.',
      'Aumentar el tiempo de espera TCP para completar la petición ya respondida.',
    ],
    correctIndex: 0,
    reasons: [
      'La comparación investiga el servicio que respondió sin borrar la evidencia ni cambiar varias variables.',
      'La respuesta 503 orienta a la disponibilidad de un participante HTTP. No demuestra un fallo de resolución que justifique cambiar DNS primero.',
      'Otras webs funcionan y esta respondió. No hay evidencia suficiente para atribuir el síntoma a la puerta de enlace.',
      'Ya hay una respuesta HTTP. Aumentar una espera TCP no explica ni corrige por sí mismo el estado 503 comunicado por el servicio.',
    ],
    explanation:
      '503 indica indisponibilidad del participante HTTP que respondió, por ejemplo por sobrecarga o mantenimiento. Compara recursos y disponibilidad; la respuesta también puede proceder de un intermediario.',
  },
};
