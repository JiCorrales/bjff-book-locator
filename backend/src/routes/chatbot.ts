import { Request, Response, Router } from 'express';
import {
  ChatMessage,
  LibraryAssistantService,
  MissingOpenAIKeyError,
  libraryAssistantService,
} from '../services/libraryAssistant.service';
import { localNlpAssistantService } from '../services/localNlp.service';
import { feedbackRepository, FeedbackEntry } from '../services/feedback.service';
import { env } from '../config/env';

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

interface ChatRequestBody {
  conversation?: ChatMessage[];
}

const allowedRoles: ChatMessage['role'][] = ['user', 'assistant'];

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const possible = value as ChatMessage;
  return (
    allowedRoles.includes(possible.role) &&
    typeof possible.content === 'string' &&
    possible.content.trim().length > 0
  );
};

const sanitizeConversation = (conversation: ChatMessage[] = []): ChatMessage[] =>
  conversation
    .filter(isChatMessage)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_CONTENT_LENGTH),
    }))
    .slice(-MAX_MESSAGES);

const handleConversation =
  (assistant: LibraryAssistantService) => async (req: Request, res: Response) => {
    const body: ChatRequestBody = req.body ?? {};

    if (!Array.isArray(body.conversation)) {
      return res.status(400).json({
        message: 'La conversacion es obligatoria y debe ser un arreglo de mensajes.',
      });
    }

    const conversation = sanitizeConversation(body.conversation);

    if (conversation.length === 0) {
      return res.status(400).json({
        message: 'La conversacion proporcionada esta vacia.',
      });
    }

    try {
      const reply = await assistant.reply(conversation);

      return res.json({
        message: { role: 'assistant', content: reply },
      });
    } catch (error) {
      // Si el asistente remoto no está disponible, intenta respuesta rápida con NLP local
      if (error instanceof MissingOpenAIKeyError) {
        try {
          const reply = await localNlpAssistantService.reply(conversation);
          return res.json({ message: { role: 'assistant', content: reply } });
        } catch (fallbackError) {
          // Continúa a manejo genérico
        }
      }

      if (error instanceof Error) {
        console.error('[chatbot] Error al generar respuesta:', error.message);
      } else {
        console.error('[chatbot] Error desconocido al generar respuesta:', error);
      }

      return res.status(500).json({
        message:
          'Lo siento, ahora mismo no puedo responder. Intenta de nuevo mas tarde o contacta al personal de biblioteca.',
      });
    }
  };

export const createChatbotRouter = (
  assistant: LibraryAssistantService = env.OPENAI_API_KEY
    ? libraryAssistantService
    : (localNlpAssistantService as unknown as LibraryAssistantService),
) => {
  const router = Router();
  router.post('/conversation', handleConversation(assistant));
  router.post('/feedback', (req: Request, res: Response) => {
    const { assistantMessage, rating, comment } = req.body ?? {};

    if (rating !== 'up' && rating !== 'down') {
      return res.status(400).json({ message: 'El campo rating debe ser "up" o "down".' });
    }

    const entry: FeedbackEntry = {
      assistantMessage: typeof assistantMessage === 'string' ? assistantMessage : undefined,
      rating,
      comment: typeof comment === 'string' ? comment : undefined,
      createdAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] as string | undefined,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined,
    };

    feedbackRepository.add(entry);
    return res.status(201).json({ message: 'Feedback registrado.' });
  });
  return router;
};

const router = createChatbotRouter();

export default router;
