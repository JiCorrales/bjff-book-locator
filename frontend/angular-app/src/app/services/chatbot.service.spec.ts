import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ChatbotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('genera saludo según hora (noches)', () => {
    const spy = spyOn(Date.prototype, 'getHours').and.returnValue(21);
    const greeting = (service as any).getGreeting();
    expect(greeting.startsWith('Buenas noches')).toBeTrue();
    spy.and.callThrough();
  });

  it('genera saludo según hora (mañanas)', () => {
    const spy = spyOn(Date.prototype, 'getHours').and.returnValue(9);
    const greeting = (service as any).getGreeting();
    expect(greeting.startsWith('Buenos dias')).toBeTrue();
    spy.and.callThrough();
  });

  it('restablece la conversación con mensaje inicial del asistente', () => {
    service.resetConversation();
    const messages = service.conversation();
    expect(messages.length).toBe(1);
    expect(messages[0].sender).toBe('assistant');
    expect(messages[0].content.toLowerCase()).toContain('lia');
  });

  it('envía feedback y marca el mensaje como enviado', async () => {
    // Preparar conversación con mensaje del asistente
    const initial = service.conversation();
    const assistantMsg = initial[0];
    expect(assistantMsg.sender).toBe('assistant');

    // Enviar feedback
    const promise = service.sendFeedback(assistantMsg.id, 'up');
    const req = httpMock.expectOne('/api/chatbot/feedback');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Feedback registrado.' });
    await promise;

    const updated = service.conversation().find((m) => m.id === assistantMsg.id)!;
    expect(updated.feedbackSent).toBeTrue();
    httpMock.verify();
  });
});