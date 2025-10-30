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
  

  @ViewChild('messageInput')
  private messageInput?: ElementRef<HTMLTextAreaElement>;

  @ViewChild('messagesList')
  private messagesList?: ElementRef<HTMLDivElement>;

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
      this.scrollToBottom();
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
    this.scrollToBottom();
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
    this.scrollToBottom();
  }

  protected shouldShowSuggestions(): boolean {
    return !this.isBusy() && this.messages().length <= 4;
  }

  protected handleInput() {
    this.updateOverflowState();
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

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesList?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  ngOnDestroy(): void {}
}
