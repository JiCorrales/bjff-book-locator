import {
  Component,
  ElementRef,
  HostBinding,
  ViewChild,
  OnDestroy,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatViewMessage } from '../../services/chatbot.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-library-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-chatbot.html',
  styleUrl: './library-chatbot.css',
})
export class LibraryChatbotComponent implements OnDestroy {
  private readonly chatbot = inject(ChatbotService);
  private readonly themeService = inject(ThemeService);

  protected isOpen = false;
  protected messageDraft = '';
  protected isInputOverflow = false;
  protected readonly assistant = this.chatbot.assistant;
  protected readonly suggestions = this.chatbot.suggestions;

  protected readonly messages = this.chatbot.conversation;
  protected readonly isBusy = this.chatbot.busy;
  protected readonly error = this.chatbot.lastError;
  protected readonly detailLevel = this.chatbot.detailLevel;
  protected readonly detailLevelLabel = computed(() => {
    const value = this.detailLevel();
    if (value <= 30) {
      return `${value}% · Respuestas concisas`;
    }
    if (value >= 70) {
      return `${value}% · Respuestas detalladas`;
    }
    return `${value}% · Respuestas equilibradas`;
  });
  protected readonly detailStops = [
    { value: 0, label: 'Conciso' },
    { value: 50, label: 'Equilibrado' },
    { value: 100, label: 'Detallado' },
  ];

  @ViewChild('messageInput')
  private messageInput?: ElementRef<HTMLTextAreaElement>;

  @HostBinding('attr.data-theme')
  get dataTheme(): string {
    return this.themeService.theme;
  }

  constructor() {}

  protected trackById(_index: number, message: ChatViewMessage) {
    return message.id;
  }

  protected togglePanel() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.focusInput();
      this.updateOverflowState();
    }
  }

  protected closePanel() {
    this.isOpen = false;
  }

  protected async submitForm(event: Event) {
    event.preventDefault();
    await this.sendCurrentMessage();
  }

  protected async sendCurrentMessage() {
    if (!this.messageDraft.trim()) {
      return;
    }

    await this.chatbot.sendMessage(this.messageDraft);
    this.messageDraft = '';
    this.isInputOverflow = false;
    this.focusInput();
    this.updateOverflowState();
  }

  protected handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.sendCurrentMessage();
    }
  }

  protected applySuggestion(text: string) {
    this.messageDraft = text;
    this.focusInput();
    this.updateOverflowState();
  }

  protected async sendFeedbackUp(messageId: string) {
    await this.chatbot.sendFeedback(messageId, 'up');
  }

  protected async sendFeedbackDown(messageId: string) {
    await this.chatbot.sendFeedback(messageId, 'down');
  }

  protected resetConversation() {
    this.chatbot.resetConversation();
    this.messageDraft = '';
    this.isInputOverflow = false;
    this.focusInput();
    this.updateOverflowState();
  }

  protected shouldShowSuggestions(): boolean {
    return !this.isBusy() && this.messages().length <= 4;
  }

  protected handleDetailLevelInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input?.value ?? this.detailLevel());
    this.chatbot.setDetailLevel(value);
  }

  protected handleInput() {
    this.updateOverflowState();
  }

  protected isSliderStopActive(stopValue: number): boolean {
    return this.detailLevel() >= stopValue;
  }

  private focusInput() {
    setTimeout(() => {
      this.messageInput?.nativeElement.focus();
      this.updateOverflowState();
    });
  }

  private updateOverflowState() {
    if (!this.messageInput) {
      this.isInputOverflow = false;
      return;
    }

    const textarea = this.messageInput.nativeElement;
    const hasOverflow =
      textarea.scrollHeight - textarea.clientHeight > 2 ||
      textarea.scrollWidth - textarea.clientWidth > 2;

    this.isInputOverflow = hasOverflow;
  }

  ngOnDestroy(): void {}
}
