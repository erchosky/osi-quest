export const sessionLesson = {
  introduction:
    'Sesión representa la organización del diálogo entre participantes. No es sinónimo del botón «iniciar sesión» ni de abrir una conexión TCP. Estudiarás el inicio y cierre del diálogo, su coordinación y el sentido de acordar puntos de recuperación.',
  sections: [
    {
      title: 'Coordinar un intercambio que tiene continuidad',
      paragraphs: [
        'No toda comunicación consiste en enviar un mensaje aislado. Los participantes pueden necesitar acordar cómo empieza un diálogo, cómo se mantiene, cómo termina y cómo se coordinan sus fases. OSI separa esta responsabilidad de llevar datos entre procesos y de representar su contenido.',
        'Imagina una conversación para organizar un viaje. Saludar, acordar de qué vais a hablar, respetar turnos y cerrar lo acordado da estructura al diálogo. Las llamadas telefónicas y las palabras son otros mecanismos; esta analogía no convierte toda conversación humana en un protocolo OSI.',
      ],
    },
    {
      title: 'Un ejemplo de trabajo con puntos acordados',
      paragraphs: [
        'Dos participantes colaboran en una operación larga dividida en partes. Al completar una parte, acuerdan un punto de sincronización. Si se interrumpe el diálogo, un mecanismo de recuperación puede utilizar esos puntos para saber qué parte del intercambio quedó acordada y desde dónde continuar.',
        'El ejemplo explica la responsabilidad conceptual de Sesión. No garantiza que cualquier subida de archivos tenga ese mecanismo, ni que una conexión TCP interrumpida se reanude automáticamente. En una aplicación real necesitas investigar qué protocolo y qué estado implementan la recuperación.',
        'Antes de continuar hay preguntas distintas: ¿seguimos hablando los mismos participantes?, ¿qué punto reconocen ambos?, ¿qué fase debe repetirse? Una red disponible ayuda a intercambiar datos, pero no responde por sí sola a esas preguntas del diálogo.',
      ],
    },
    {
      title: 'Las ideas que debes distinguir',
      items: [
        'Establecer y cerrar el diálogo: organizar su ciclo de vida, no solo comprobar que existe señal.',
        'Control del diálogo: coordinar quién puede actuar y cómo avanzan las fases del intercambio según el servicio.',
        'Sincronización y recuperación: acordar referencias útiles para retomar el diálogo cuando el mecanismo lo permite.',
      ],
      paragraphs: [
        'Las funciones disponibles dependen del servicio y de lo que se acuerde. No hay una lista de garantías que toda aplicación de Internet reciba automáticamente por mencionar «sesión». El modelo describe responsabilidades; su implementación real puede estar integrada con las aplicaciones.',
      ],
    },
    {
      title: 'Sesión frente a Transporte y Presentación',
      paragraphs: [
        'Transporte comunica procesos y puede proporcionar un flujo fiable, como TCP. Sesión añade una forma de razonar sobre el diálogo sostenido entre participantes. Que unos bytes hayan llegado en orden no significa que ambas partes compartan el mismo punto de una operación larga.',
        'Presentación trata de la representación: cómo interpretar los datos intercambiados. Sesión trata de la organización del intercambio. Acordar una fase y acordar una codificación son problemas distintos, aunque una misma aplicación tenga que resolver los dos.',
      ],
    },
    {
      title: 'Por qué una cuenta web no demuestra capa 5',
      paragraphs: [
        'Una web puede llamar «sesión» al estado que mantiene tras autenticar al usuario, mediante cookies u otros mecanismos. Es el uso de una palabra en el diseño de una aplicación. No prueba que ese mecanismo sea una implementación independiente de la capa de Sesión OSI.',
        'Si la web te vuelve a pedir credenciales, investiga qué evidencia hay: caducidad, configuración, estado del navegador o comportamiento del servicio. No diagnostiques «se rompió la capa 5» solo por el mensaje de la pantalla.',
      ],
      items: [
        'Describe primero la función observada, sin clasificar por una palabra.',
        'Distingue perder autenticación, perder conectividad y perder el estado acordado de una operación.',
        'Pregunta qué participante conserva el estado y qué protocolo permite recuperarlo.',
      ],
    },
    {
      title: 'Cómo usar esta capa al aprender TCP/IP',
      paragraphs: [
        'En la comparación habitual de cuatro capas, TCP/IP agrupa con Aplicación funciones que OSI explica como Sesión, Presentación y Aplicación. Por eso es útil conocerlas sin buscar siete programas separados en el ordenador.',
        'Piensa en una reunión: la comunicación puede oírse bien y, aun así, los participantes no saber qué asunto quedó acordado. Explica qué representa la coordinación del diálogo y qué pertenece al transporte o al contenido. Esa separación vale más que memorizar una lista de marcas.',
      ],
    },
  ],
  takeaway:
    'Sesión organiza el diálogo y sus posibles puntos de sincronización. Una cuenta web o una conexión TCP no bastan para identificar esa responsabilidad.',
  teachBack:
    'Describe una operación larga con fases acordadas y explica qué información necesitarían ambas partes para retomarla. Separa ese estado de los bytes que transporta TCP.',
  check: {
    prompt:
      'En un ejemplo conceptual OSI, dos participantes acuerdan retomar un diálogo desde la última fase reconocida por ambos. ¿Qué información representa ese acuerdo?',
    choices: [
      'La dirección MAC que permite entregar la próxima trama del enlace.',
      'La codificación con la que se representan los caracteres enviados.',
      'El puerto TCP que distingue al proceso receptor en el otro extremo.',
      'Un punto compartido de sincronización dentro del diálogo mantenido.',
    ],
    correctIndex: 3,
    reasons: [
      'La MAC resuelve entrega de Enlace. No indica qué fase del diálogo reconocen los participantes.',
      'La codificación pertenece a la representación de datos. No identifica el punto de continuidad del diálogo.',
      'El puerto identifica una comunicación con un proceso; no registra por sí mismo las fases acordadas de la operación.',
      'El acuerdo sobre dónde continuar representa sincronización del diálogo, una responsabilidad de Sesión.',
    ],
    explanation:
      'El caso distingue continuidad del diálogo, representación y transporte. En TCP/IP una aplicación puede integrar estas funciones; el ejemplo no atribuye la recuperación automática a TCP.',
  },
};
