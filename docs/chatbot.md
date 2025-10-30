# Chatbot de Biblioteca (Lia)

Este documento describe la arquitectura, uso y pruebas del chatbot de la biblioteca (Lia), desarrollado para comprender consultas en español, responder con claridad y recibir retroalimentación de los usuarios.

## Capacidades

- Comprensión de consultas en español mediante:
  - Modelo conversacional remoto (OpenAI) si está configurado.
  - Motor NLP local con reglas en español como respaldo.
- Respuestas claras y concisas, con listas breves y orientación al portal.
- Manejo de diferentes tipos de preguntas: informativas, técnicas y administrativas.
- Sistema de retroalimentación con botones 👍/👎 para mejorar continuamente.
- Manejo de errores: respuestas amistosas cuando el asistente no está disponible o no comprende.
- Rendimiento: timeout de 2 segundos en peticiones para respuestas rápidas.
- Escalabilidad: backend Express, endpoints idempotentes y sanitización de entrada.

## Arquitectura

- Frontend Angular
  - `ChatbotService`: gestiona conversación, preferencias y llamadas a API con `timeout(2000)`.
  - `LibraryChatbotComponent`: UI con sugerencias, nivel de detalle y botones de feedback.
  - Endpoint feedback: `/api/chatbot/feedback`.
- Backend Express (TypeScript)
  - `LibraryAssistantService`: integra OpenAI si `OPENAI_API_KEY` está disponible.
  - `LocalNlpAssistantService`: fallback inmediato con intents en español.
  - Router `/api/chatbot/conversation`: sanitiza conversación y responde con el asistente disponible.
  - Router `/api/chatbot/feedback`: registra valoraciones en memoria.

## Endpoints

- `POST /api/chatbot/conversation`
  - Body: `{ conversation: Array<{ role: 'user'|'assistant', content: string }> }`
  - Respuesta: `{ message: { role: 'assistant', content: string } }`
- `POST /api/chatbot/feedback`
  - Body: `{ assistantMessage?: string, rating: 'up'|'down', comment?: string }`
  - Respuesta: `{ message: 'Feedback registrado.' }`

## Configuración

Variables de entorno en backend (`.env`):

- `OPENAI_API_KEY`: clave para activar el modelo remoto (opcional).
- `OPENAI_MODEL`, `OPENAI_TEMPERATURE`, `OPENAI_MAX_OUTPUT_TOKENS`: parámetros del modelo.

Si no se configura `OPENAI_API_KEY`, se usa automáticamente el motor NLP local.

## Uso (Manual Básico)

1. Abrir el widget “Hablar con Lia” en la esquina inferior derecha.
2. Ajustar el “Nivel de detalle” si desea respuestas más concisas o desarrolladas.
3. Escribir la consulta o elegir una sugerencia (“Buscar libro por código”, etc.).
4. Enviar y esperar la respuesta; si fue útil, marcar 👍/👎.
5. Reiniciar la conversación en cualquier momento con el botón “Reiniciar”.

## Pruebas

- Frontend: `ChatbotService` incluye pruebas de saludo y feedback.
- Backend: `LocalNlpAssistantService` probado con intents principales y fallback.

## Notas de Diseño

- El motor NLP local cubre intents más comunes en la biblioteca; puede ampliarse con más patrones.
- El sistema de feedback actual almacena datos en memoria; puede integrarse con base de datos para análisis.
- La UI prioriza accesibilidad: indicadores de estado, `aria-label`s y controles claros.

## Próximos Pasos

- Persistir feedback en base de datos y construir panel de análisis.
- Añadir comprensión de idioma y respuesta en el idioma del usuario.
- Expandir intents técnicos/administrativos y enlaces profundos al portal.