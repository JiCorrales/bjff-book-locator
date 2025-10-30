import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { BookSearchComponent } from './components/book-search/book-search';
import { LibraryChatbotComponent } from './components/library-chatbot/library-chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, LibraryChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Book Locator');
}
