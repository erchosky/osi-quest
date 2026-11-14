export const physicalLesson = {
  introduction:
    'Antes de hablar de direcciones o servicios, hace falta mover información por un medio. Física resuelve cómo representar bits como señales y cómo recibirlas al otro lado. Al terminar distinguirás una señal disponible de una comunicación que funciona por completo.',
  sections: [
    {
      title: 'Qué problema resuelve Física',
      paragraphs: [
        'Una foto es información digital. El cable no entiende fotos: transporta variaciones eléctricas que los equipos interpretan según una tecnología acordada. La fibra usa luz y Wi-Fi usa ondas de radio. El medio cambia, pero la pregunta es la misma: ¿puede el receptor reconocer las señales que envía el emisor?',
        'Piensa en la carretera de un reparto. Sin un camino transitable no avanzas, pero una carretera abierta no decide la dirección del envío ni comprueba si la tienda tiene existencias. La analogía recuerda el medio; no significa que un bit sea literalmente un coche.',
      ],
    },
    {
      title: 'Una videollamada, paso a paso',
      paragraphs: [
        'Tu aplicación prepara audio y vídeo. Después de que otras funciones organicen sus datos, la interfaz Wi-Fi representa información mediante una señal de radio. El punto de acceso necesita recibirla y reconocerla; más adelante habrá otros medios y otros enlaces en el recorrido.',
        'Te alejas del punto de acceso y atraviesas varios muros. La recepción puede empeorar, aumentar los errores o perderse el enlace. Volver a acercarte y repetir la misma tarea permite comparar el tramo inalámbrico. No prueba que todo retraso de una llamada sea causado por la radio.',
        'La señal puede llegar bien y la llamada seguir fallando por congestión, configuración o servicio. Por eso separarás dos observaciones: existe comunicación por ese medio y la aplicación consigue lo que necesita.',
      ],
    },
    {
      title: 'Qué debes reconocer en una red real',
      items: [
        'Bits: información binaria. Un byte contiene ocho bits; la tasa de un enlace suele expresarse en bits por segundo.',
        'Señales: electricidad, luz o radio. No todos los sistemas representan cada bit como un único pulso independiente.',
        'Medio y conexión: cableado, conectores, fibra, antenas y condiciones que permiten transmitir y recibir.',
      ],
      paragraphs: [
        'Un indicador de enlace encendido es una pista útil sobre esa conexión, no un comprobador de Internet. Tampoco la velocidad negociada del enlace es la velocidad útil garantizada de una descarga: hay sobrecarga, tráfico compartido y posibles límites en otros tramos.',
      ],
    },
    {
      title: 'Física frente a Enlace',
      paragraphs: [
        'Física transmite y recibe señales. Enlace interpreta una organización de bits como una trama y utiliza información como las MAC para la entrega local. Puedes tener señal y, aun así, tramas que se descartan por errores.',
        'Ethernet y Wi-Fi incluyen funciones de ambas capas. Decir «Wi-Fi es capa 1» sin precisar la función oculta la parte de tramas y acceso al medio. Clasifica la acción: transmitir radio es Física; entregar una trama dentro del enlace es Enlace.',
      ],
    },
    {
      title: 'Investiga sin cambiarlo todo',
      items: [
        'Anota el síntoma y el alcance: ¿se pierde el enlace o solo falla una aplicación?',
        'Compara una variable: otro cable conocido, otra toma o la misma tarea cerca del punto de acceso.',
        'Observa si la mejora se repite antes de atribuir una causa. Conserva qué equipo, medio y tarea utilizaste.',
      ],
      paragraphs: [
        'Un cable deteriorado puede causar una conexión intermitente, aunque el indicador se encienda. A la inversa, una web que devuelve un error HTTP ya ha aportado una respuesta del servicio; ese dato no apunta primero a un cable completamente cortado.',
      ],
    },
    {
      title: 'Límites y una idea para recordar',
      paragraphs: [
        'Física no resuelve nombres, no elige una aplicación receptora y no interpreta una respuesta HTTP. Ofrece el medio sobre el que trabajan otras funciones. En TCP/IP suele estudiarse junto con Enlace como acceso a la red, aunque algunos materiales separan ambas.',
        'Explícalo sin mirar: al encenderse el enlace, ¿qué sabes y qué queda por comprobar? Una buena explicación menciona la señal y añade al menos un límite, como que aún falta verificar la configuración IP o el servicio.',
      ],
    },
  ],
  takeaway:
    'Física hace posible transmitir y recibir señales. Tener enlace no garantiza que una aplicación funcione.',
  teachBack:
    'Explica por qué un indicador de enlace encendido y una descarga que funciona son pruebas distintas. Pon un ejemplo por cable o por Wi-Fi.',
  check: {
    prompt:
      'Con el mismo portátil y el mismo puerto del switch, el enlace se pierde al mover un cable; con otro cable conocido no ocurre. ¿Qué hipótesis apoya la comparación?',
    choices: [
      'Un cambio de DNS altera el estado del enlace al mover el cable.',
      'El cable o sus conectores pueden causar una pérdida física intermitente.',
      'El puerto TCP del servicio decide si el indicador de enlace se mantiene.',
      'La dirección IP del servidor explica que el enlace reaccione al movimiento.',
    ],
    correctIndex: 1,
    reasons: [
      'DNS resuelve nombres; no explica por sí mismo que el enlace físico cambie al mover ese cable.',
      'La comparación mantiene equipo y puerto y cambia el cable. Apoya una hipótesis sobre ese medio o sus conectores.',
      'Un puerto TCP distingue comunicaciones entre procesos. No es el conector del switch ni controla su indicador físico.',
      'La IP del servidor no explica la diferencia repetida entre los dos cables en el mismo puerto.',
    ],
    explanation:
      'La evidencia orienta hacia el cable o sus conectores, sin identificar todavía el defecto exacto. Es una hipótesis de Física apoyada por una comparación controlada.',
  },
};
