# Contribuir

1. Usa Node.js 22 o posterior y ejecuta `npm ci`.
2. Arranca con `npm run dev` y revisa el flujo que vayas a cambiar.
3. Mantén el contenido educativo en `data`, las reglas en `domain` y los controles en la función correspondiente de `features`.
4. Conserva los identificadores de contenido para no perder el progreso existente.
5. Añade una prueba cuando cambies puntuación, selección, migración o calendario de repasos. Los cambios puramente visuales necesitan una revisión en navegador, en escritorio y móvil.
6. Ejecuta `npm run verify` antes de abrir una pull request.

Formato: dos espacios, módulos ES, nombres descriptivos, funciones centradas en una tarea. La configuración de Prettier está incluida; puedes utilizar la integración de tu editor.

El texto visible debe ser claro para una persona que empieza desde cero. Aclara las generalizaciones de redes y las limitaciones de las analogías. En una pregunta trampa explica la confusión que se pretende corregir.
