import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

export type ChatSender = 'user' | 'assistant';

export interface ChatViewMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: number;
  pending?: boolean;
  error?: boolean;
  feedbackSent?: boolean;
}

interface ChatRequestMessage {
  role: ChatSender;
  content: string;
}

interface ChatbotResponse {
  message?: {
    role: ChatSender;
    content: string;
  };
}

interface AssistantProfile {
  name: string;
  role: string;
  avatarGlyph: string;
  greeting: string;
}

const STORAGE_KEY = 'library-assistant:conversation';
const MAX_STORED_MESSAGES = 40;
const DEFAULT_DETAIL_LEVEL = 60;
const API_ENDPOINT = '/api/chatbot/conversation';
const FEEDBACK_ENDPOINT = '/api/chatbot/feedback';

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
};

const now = () => Date.now();

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);

  readonly assistant: AssistantProfile = {
    name: 'Lia',
    role: 'Asistente de Biblioteca',
    avatarGlyph: 'L',
    greeting:
      'Hola, soy Lia, la asistente virtual de la biblioteca. Puedo ayudarte con colecciones, servicios y politicas. En que te acompano hoy?',
  };

  readonly suggestions = [
    'Buscar libro por codigo',
    'Horarios y servicios disponibles',
    'Politicas de prestamo',
    'Acceso a colecciones digitales',
    'Contactar al personal',
  ];

  private readonly initialState = this.loadInitialState();
  private readonly messages = signal<ChatViewMessage[]>(this.initialState.messages);
  private readonly detailLevelValue = signal<number>(this.initialState.detailLevel);
  private readonly isProcessing = signal(false);
  private readonly errorMessage = signal<string | null>(null);

  readonly conversation = computed(() => this.messages());
  readonly busy = computed(() => this.isProcessing());
  readonly lastError = computed(() => this.errorMessage());
  readonly hasConversation = computed(() => this.messages().length > 1);
  readonly detailLevel = computed(() => this.detailLevelValue());

  async sendMessage(rawContent: string): Promise<void> {
    const content = rawContent.trim();

    if (!content || this.isProcessing()) {
      return;
    }

    const userMessage: ChatViewMessage = {
      id: createId('user'),
      sender: 'user',
      content,
      timestamp: now(),
    };

    const pendingAssistant: ChatViewMessage = {
      id: createId('assistant'),
      sender: 'assistant',
      content: 'Dame un momento, estoy consultando la informacion...',
      timestamp: now(),
      pending: true,
    };

    const conversationForRequest: ChatRequestMessage[] = this.messages()
      .filter((message) => !message.pending)
      .map<ChatRequestMessage>((message) => ({
        role: message.sender,
        content: message.content,
      }));

    const preferenceInstruction = this.buildPreferenceInstruction();
    if (preferenceInstruction) {
      conversationForRequest.push({
        role: 'user',
        content: preferenceInstruction,
      });
    }

    conversationForRequest.push({ role: 'user', content });

    this.errorMessage.set(null);
    this.isProcessing.set(true);
    this.messages.update((current) => [...current, userMessage, pendingAssistant]);
    this.persist();

    try {
      const response = await firstValueFrom(
        this.http
          .post<ChatbotResponse>(API_ENDPOINT, {
            conversation: conversationForRequest,
          })
          .pipe(timeout(2000)),
      );

      const assistantContent = response.message?.content?.trim();

      if (!assistantContent) {
        throw new Error('Respuesta vacia');
      }

      this.messages.update((current) =>
        current.map((message) =>
          message.id === pendingAssistant.id
            ? {
                ...message,
                content: assistantContent,
                timestamp: now(),
                pending: false,
              }
            : message,
        ),
      );
      this.persist();
    } catch (error) {
      const friendlyMessage = this.mapError(error);
      this.errorMessage.set(friendlyMessage);

      this.messages.update((current) =>
        current.map((message) =>
          message.id === pendingAssistant.id
            ? {
                ...message,
                content:
                  'No logre obtener una respuesta automatica. Puedes intentar de nuevo o contactar al personal en biblioteca@instituto.edu.',
                timestamp: now(),
                pending: false,
                error: true,
              }
            : message,
        ),
      );
      this.persist();
    } finally {
      this.isProcessing.set(false);
    }
  }

  async sendFeedback(assistantMessageId: string, rating: 'up' | 'down', comment?: string) {
    const message = this.messages().find((m) => m.id === assistantMessageId);
    if (!message || message.sender !== 'assistant' || message.pending) {
      return;
    }

    try {
      await firstValueFrom(
        this.http
          .post(FEEDBACK_ENDPOINT, {
            assistantMessage: message.content,
            rating,
            comment,
          })
          .pipe(timeout(2000)),
      );
      this.messages.update((current) =>
        current.map((m) => (m.id === assistantMessageId ? { ...m, feedbackSent: true } : m)),
      );
      this.persist();
    } catch {
      // No interrumpe la conversación si falla el feedback
    }
  }

  setDetailLevel(value: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    if (this.detailLevelValue() === clamped) {
      return;
    }

    this.detailLevelValue.set(clamped);
    this.persist();
  }

  resetConversation() {
    this.errorMessage.set(null);
    this.messages.set(this.buildInitialMessages());
    this.persist();
  }

  private loadInitialState(): { messages: ChatViewMessage[]; detailLevel: number } {
    if (typeof window === 'undefined') {
      return {
        messages: this.buildInitialMessages(),
        detailLevel: DEFAULT_DETAIL_LEVEL,
      };
    }

    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          messages: this.buildInitialMessages(),
          detailLevel: DEFAULT_DETAIL_LEVEL,
        };
      }

      const parsed = JSON.parse(raw) as
        | ChatViewMessage[]
        | { messages?: unknown; detailLevel?: unknown };

      if (Array.isArray(parsed)) {
        return {
          messages: this.normalizeMessages(parsed),
          detailLevel: DEFAULT_DETAIL_LEVEL,
        };
      }

      if (parsed && Array.isArray(parsed.messages)) {
        const detail =
          typeof parsed.detailLevel === 'number' ? parsed.detailLevel : DEFAULT_DETAIL_LEVEL;
        return {
          messages: this.normalizeMessages(parsed.messages as ChatViewMessage[]),
          detailLevel: Math.min(100, Math.max(0, Math.round(detail))),
        };
      }

      return {
        messages: this.buildInitialMessages(),
        detailLevel: DEFAULT_DETAIL_LEVEL,
      };
    } catch {
      return {
        messages: this.buildInitialMessages(),
        detailLevel: DEFAULT_DETAIL_LEVEL,
      };
    }
  }

  private buildInitialMessages(): ChatViewMessage[] {
    return [
      {
        id: createId('assistant'),
        sender: 'assistant',
        content: this.getGreeting(),
        timestamp: now(),
      },
    ];
  }

  private normalizeMessages(entries: ChatViewMessage[]): ChatViewMessage[] {
    const restored = entries
      .filter(
        (entry): entry is ChatViewMessage =>
          !!entry &&
          (entry.sender === 'user' || entry.sender === 'assistant') &&
          typeof entry.content === 'string',
      )
      .map((entry) => ({
        ...entry,
        pending: false,
        error: false,
      }))
      .slice(-MAX_STORED_MESSAGES);

    return restored.length > 0 ? restored : this.buildInitialMessages();
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Buenos dias' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return `${timeGreeting}, soy ${this.assistant.name}, tu asistente de biblioteca. Puedo ayudarte con colecciones, servicios y politicas. En que te acompano hoy?`;
  }

  private persist() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const payload = JSON.stringify({
        messages: this.messages()
          .slice(-MAX_STORED_MESSAGES)
          .map((message) => ({
            ...message,
            pending: undefined,
            error: undefined,
          })),
        detailLevel: this.detailLevelValue(),
      });
      window.sessionStorage.setItem(STORAGE_KEY, payload);
    } catch {
      // Ignore storage errors silently.
    }
  }

  private buildPreferenceInstruction(): string {
    const detail = this.detailLevelValue();
    return `Preferencia de nivel de detalle: ${detail} de 100 (0 = respuestas muy concisas, 100 = respuestas muy desarrolladas). Tenlo presente al responder.`;
  }

  private mapError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 503) {
        return 'El asistente no esta disponible. Revisa la configuracion de la clave de OpenAI o contacta al administrador.';
      }

      if (error.status >= 500) {
        return 'Hubo un problema en el servidor de la biblioteca. Intenta de nuevo en breve.';
      }

      if (error.status === 400) {
        return 'No pude procesar la consulta. Revisa el mensaje e intenta nuevamente.';
      }
    }

    if (error instanceof Error) {
      return `No logre conectarme con el asistente (${error.message}). Intenta otra vez.`;
    }

    return 'No logre conectarme con el asistente. Intenta otra vez.';
  }
}
