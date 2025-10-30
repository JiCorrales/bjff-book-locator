import OpenAI from 'openai';
import { env } from '../config/env';

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super('OpenAI API key is not configured.');
    this.name = 'MissingOpenAIKeyError';
  }
}

const siteOverview = `
Contexto del sitio Book Locator:
- Pagina principal con un buscador de codigos que combina un prefijo de pais (AR, BO, BR, CL, CO, CR, CU, DO, EC, SV, GT, HN, MX, NI, PA, PY, PE, PR, UY, VE, ES) y un identificador numerico para localizar ejemplares en la biblioteca fisica.
- Se muestran ayudas visuales (piso, seccion, estante) para orientar al usuario dentro del edificio.
- El encabezado permite cambiar el idioma (espanol, ingles, frances), alternar entre tema claro u oscuro e iniciar sesion.
 - El personal autenticado administra usuarios, rangos de clasificacion y ajustes generales desde modulos como General, Configuración, Rango y Usuarios.
- Servicios destacados: prestamo y renovacion de material impreso, reservas de espacios de estudio, acceso a colecciones digitales e inducciones o talleres de alfabetizacion informacional.
- Normas recurrentes: presentar credencial vigente, respetar tiempos de prestamo (renovacion sujeta a disponibilidad, multas a partir del cuarto dia de atraso), conservar silencio y evitar alimentos en salas de coleccion, reservar con antelacion los recursos especiales.
`;

const buildSystemPrompt = () => `
Eres ${env.CHATBOT_ASSISTANT_NAME}, asistente virtual de la biblioteca que atiende en el portal Book Locator.
Tono: profesional, cordial y conciso. Usa el idioma del usuario; si no lo detectas, responde en espanol neutro.

${siteOverview}

Instrucciones clave:
1. Responde con informacion clara y verificable basada en el contexto anterior y en buenas practicas bibliotecarias. Si no cuentas con datos suficientes, admitelo y ofrece contactar al personal humano en el mostrador de la entrada.
2. Para consultas complejas, tramites presenciales o casos sensibles (por ejemplo, sanciones, estados de cuenta, materiales especiales), sugiere escalar al personal humano indicando el contacto y los datos previos que conviene preparar.
3. Usa listas breves o pasos numerados cuando ayuden a la claridad. Incluye referencias a secciones del sitio (por ejemplo, "Menu principal -> Iniciar sesion") cuando proceda.
4. Manten respuestas cortas, evita parrafos largos y cierra con una invitacion amable a continuar o a reiniciar la conversacion si el usuario lo desea.
5. Nunca inventes informacion detallada (horarios, sanciones especificas, etc.) si no la tienes; en su lugar, proporciona una guia general y escalamiento.
6. Si el usuario pregunta sobre la parte de administrador o asistente de la pagina, informa que solo puede interactuar con la parte publica.
`;

const defaultSystemPrompt = buildSystemPrompt();

export class LibraryAssistantService {
  private readonly client: OpenAI | null;
  private readonly systemPrompt: string;

  constructor() {
    this.client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
    this.systemPrompt = defaultSystemPrompt;

    if (this.client) {
      console.info(`[chatbot] OpenAI habilitado con el modelo ${env.OPENAI_MODEL}`);
    } else {
      console.info('[chatbot] OpenAI deshabilitado; se usara NLP local como respaldo.');
    }
  }

  async reply(conversation: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new MissingOpenAIKeyError();
    }

    const sanitized = conversation
      .filter(
        (message): message is ChatMessage =>
          !!message &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, 2000),
      }))
      .slice(-20);

    const startedAt = Date.now();
    console.info(`[chatbot] [OpenAI] Solicitud enviada con ${sanitized.length} mensajes.`);

    const response = await this.client.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        { role: 'system', content: this.systemPrompt },
        ...sanitized.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: env.OPENAI_TEMPERATURE,
      max_output_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
    });

    console.info(`[chatbot] [OpenAI] Respuesta recibida en ${Date.now() - startedAt} ms.`);

    const plainText = (response.output_text ?? '').trim();

    if (plainText.length === 0) {
      throw new Error('La respuesta del modelo llego vacia.');
    }

    return plainText;
  }
}

export const libraryAssistantService = new LibraryAssistantService();
