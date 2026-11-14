export const presentationLesson = {
  introduction:
    'Presentación permite razonar sobre cómo se representan los datos para que el receptor pueda interpretarlos. Estudiarás codificación, formato, compresión y cifrado como transformaciones distintas, sin confundirlas con el diseño visual de una pantalla.',
  sections: [
    {
      title: 'Los mismos bits pueden interpretarse de formas distintas',
      paragraphs: [
        'Transmitir bytes no basta para que el contenido tenga sentido. Emisor y receptor necesitan una representación compatible: cómo interpretar caracteres, números o estructuras. OSI distingue esa responsabilidad de organizar el diálogo y de decidir qué operación ofrece el servicio.',
        'Piensa en una carta escrita en un idioma y un código que ambos lectores conocen. El reparto puede llegar intacto y aun así el destinatario no entenderla. La analogía recuerda un acuerdo de representación, no una traducción automática de cualquier contenido.',
      ],
    },
    {
      title: 'Un nombre que llega, pero se lee mal',
      paragraphs: [
        'Un emisor manda el nombre «Muñoz» en UTF-8 y el receptor interpreta sus bytes con otra codificación. Puede mostrar caracteres extraños aunque la transmisión haya conservado todos los bytes. Volver a enviarlos sin corregir la interpretación reproduce el problema.',
        'Para investigar, separa los bytes recibidos de cómo se decodifican. Comprueba qué representación declara el mensaje, qué espera el receptor y qué transformaciones intermedias se han aplicado. El carácter que ves en pantalla es el resultado de esa interpretación.',
        'El ejemplo se asocia conceptualmente a Presentación. En Internet la codificación puede estar especificada por un protocolo de aplicación o su formato de datos; no necesitas imaginar un programa separado de capa 6 para entender la responsabilidad.',
      ],
    },
    {
      title: 'Tres transformaciones con objetivos diferentes',
      items: [
        'Codificar representa información según reglas: por ejemplo, caracteres en UTF-8. Conocer la regla permite interpretarla.',
        'Comprimir busca una representación más compacta. El receptor necesita el método adecuado para reconstruir o interpretar el contenido.',
        'Cifrar busca proteger el contenido mediante un mecanismo criptográfico y claves. No equivale simplemente a cambiar el formato.',
      ],
      paragraphs: [
        'Base64 es una forma de codificar bytes como texto, no una defensa que vuelva secreto el contenido. Del mismo modo, un archivo comprimido no queda confidencial por estar comprimido. La pregunta correcta es qué objetivo cumple cada transformación.',
        'Una comunicación puede combinar transformaciones: representar datos, comprimirlos y protegerlos. Ese orden y sus detalles dependen del protocolo concreto; no basta con memorizar tres etiquetas de OSI para asegurar que el receptor podrá procesarlo.',
      ],
    },
    {
      title: 'Formato de datos frente a petición del servicio',
      paragraphs: [
        'Una aplicación puede expresar «guardar este contacto» y usar JSON para representar los campos. La operación que pide el cliente pertenece al servicio; la representación describe cómo interpretar el contenido enviado. Un JSON válido puede contener una petición que el servicio rechaza.',
        'No confundas Presentación con dibujar una interfaz bonita. En OSI hablamos de representación de datos intercambiados, no de colores de botones. Tampoco TCP interpreta por sí mismo el significado de los campos de un JSON.',
      ],
    },
    {
      title: 'Dónde encaja la protección de TLS',
      paragraphs: [
        'Al estudiar OSI, el cifrado suele relacionarse con Presentación como función de transformación. TLS es un protocolo real con negociación, protección y comprobaciones de identidad. Encerrarlo entero en una sola capa OSI no describe bien todas sus responsabilidades.',
        'Un aviso de certificado no implica que TCP haya cifrado mal, y recibir datos por TCP no demuestra confidencialidad. Separa transporte, representación y mecanismos de seguridad, y después mira el protocolo real que usa la aplicación.',
      ],
      items: [
        'Comprueba formato y codificación declarados.',
        'Distingue errores de interpretación de pérdidas de datos.',
        'Verifica si necesitas una clave, un descompresor o un decodificador: no hacen el mismo trabajo.',
      ],
    },
    {
      title: 'Recordar la función sin forzar el modelo',
      paragraphs: [
        'En TCP/IP muchas de estas funciones se integran con Aplicación. La utilidad de OSI es poder preguntar «¿llegaron los bytes?» y después «¿podemos interpretarlos?» sin confundir ambas pruebas.',
        'Explica por qué repetir una transmisión correcta no arregla una codificación equivocada. Después explica por qué ocultar una contraseña en Base64 no es cifrarla. Si puedes separar esos dos casos, estás utilizando la idea de representación y sus límites.',
      ],
    },
  ],
  takeaway:
    'Presentación trata de representar e interpretar datos. Codificar, comprimir y cifrar persiguen objetivos diferentes.',
  teachBack:
    'Explica cómo puede llegar un nombre con todos sus bytes y mostrarse mal. Añade por qué cambiar su codificación no lo vuelve secreto.',
  check: {
    prompt:
      'Se ha comprobado que los bytes de un texto UTF-8 llegan intactos, pero el receptor los interpreta con otra codificación y muestra caracteres extraños. ¿Qué corregirías primero?',
    choices: [
      'La representación esperada y la decodificación que aplica el receptor.',
      'La MAC del siguiente salto para reconstruir caracteres dentro de la trama.',
      'La retransmisión TCP de los mismos bytes ya recibidos correctamente.',
      'La ruta IP para cambiar el significado de los bytes que llegaron intactos.',
    ],
    correctIndex: 0,
    reasons: [
      'La evidencia apunta a cómo se interpretan los bytes. Emisor y receptor necesitan una representación compatible.',
      'Una MAC ayuda a entregar tramas. No especifica cómo decodificar los caracteres contenidos en los datos.',
      'Repetir los mismos bytes intactos no corrige la regla de interpretación equivocada.',
      'Una ruta cambia por dónde avanzan los paquetes, no la codificación con la que el receptor interpreta datos ya recibidos.',
    ],
    explanation:
      'El transporte correcto y la interpretación correcta son condiciones distintas. Revisa el acuerdo de representación y el decodificador antes de atribuir el texto ilegible a la entrega de la red.',
  },
};
