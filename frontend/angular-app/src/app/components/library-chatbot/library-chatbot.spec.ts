import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LibraryChatbotComponent } from './library-chatbot';
import { ChatbotService, ChatViewMessage } from '../../services/chatbot.service';
import { ThemeService, ThemeName } from '../../services/theme.service';

class MockChatbotService {
  assistant = { name: 'Lia', role: 'Asistente de Biblioteca', avatarGlyph: 'L', greeting: '' };
  suggestions = [
    'Buscar libro por codigo',
    'Horarios y servicios disponibles',
    'Politicas de prestamo',
    'Acceso a colecciones digitales',
    'Contactar al personal',
  ];

  private messagesArr: ChatViewMessage[] = [
    { id: 'assistant-1', sender: 'assistant', content: 'Hola', timestamp: Date.now() },
  ];

  conversation = () => this.messagesArr;
  busy = () => false;
  lastError = () => null;

  sendMessage(_content: string): Promise<void> {
    this.messagesArr.push({ id: `user-${this.messagesArr.length}`, sender: 'user', content: 'x', timestamp: Date.now() });
    return Promise.resolve();
  }

  resetConversation(): void {
    this.messagesArr = [{ id: 'assistant-1', sender: 'assistant', content: 'Hola', timestamp: Date.now() }];
  }
}

class MockThemeService {
  private subject = new BehaviorSubject<ThemeName>('light');
  theme$ = this.subject.asObservable();
  get theme(): ThemeName { return this.subject.getValue(); }
  setTheme(theme: ThemeName) { this.subject.next(theme); }
  toggleTheme() { this.setTheme(this.theme === 'light' ? 'dark' : 'light'); }
}

describe('LibraryChatbotComponent', () => {
  let fixture: ComponentFixture<LibraryChatbotComponent>;
  let component: LibraryChatbotComponent;
  let chatbot: MockChatbotService;
  let theme: MockThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryChatbotComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ChatbotService, useClass: MockChatbotService },
        { provide: ThemeService, useClass: MockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LibraryChatbotComponent);
    component = fixture.componentInstance;
    chatbot = TestBed.inject(ChatbotService) as unknown as MockChatbotService;
    theme = TestBed.inject(ThemeService) as unknown as MockThemeService;

    // Configurar variables de tema para el entorno de prueba
    document.body.style.setProperty('--text-color', '#1f232b');
    document.body.style.setProperty('--surface', '#ffffff');
    document.body.style.setProperty('--border-color', '#ddd');
    document.body.classList.add('light-theme');
    // Inicializar la plantilla y los HostBindings
    fixture.detectChanges();
  });

  it('muestra sugerencias con texto legible en modo claro', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.assistant-toggle');
    toggle.click();
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.assistant-suggestions-list button')
    );

    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn.textContent?.trim()).not.toBe('');
      const color = getComputedStyle(btn).color;
      expect(color).not.toBe('rgb(255, 255, 255)');
    }
  });

  it('oculta sugerencias al superar 4 mensajes', async () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.assistant-toggle');
    toggle.click();
    fixture.detectChanges();

    for (let i = 0; i < 4; i++) {
      await chatbot.sendMessage('x');
    }

    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.assistant-suggestions');
    expect(container).toBeNull();
  });

  it('aplica la sugerencia al borrador al hacer click', async () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.assistant-toggle');
    toggle.click();
    fixture.detectChanges();

    const first: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.assistant-suggestions-list button'
    );
    first.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.assistant-input textarea');
    expect(textarea.value).toBe(chatbot.suggestions[0]);
  });

  it('actualiza data-theme cuando cambia el tema', async () => {
    const hostTheme = () => (fixture.nativeElement as HTMLElement).getAttribute('data-theme');
    expect(hostTheme()).toBe('light');
    theme.toggleTheme();
    // Esperar a que la suscripción del componente procese el cambio de tema
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(hostTheme()).toBe('dark');
  });
});