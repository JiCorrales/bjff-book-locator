import { Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BOOK_PREFIXES, BookPrefixOption } from '../../models/book-prefix.model';
import { TranslationService, LanguageCode } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './book-search.html',
  styleUrl: './book-search.css'
})
export class BookSearchComponent implements OnDestroy {
  bookPrefixes = BOOK_PREFIXES;
  selectedPrefix = BOOK_PREFIXES[0]?.code ?? '';
  bookCode = '';
  prefixDropdownOpen = false;
  uiText = {
    title: '',
    subtitle: '',
    placeholder: '',
    searchButton: '',
    codeLabel: '',
    codeFallback: '',
    galleryTitle: '',
    galleryFloor: '',
    gallerySection: '',
    galleryShelf: '',
    noPrefix: ''
  };

  private languageSubscription: Subscription;

  constructor(
    private host: ElementRef<HTMLElement>,
    private translation: TranslationService
  ) {
    this.updateText(this.translation.currentLang);
    this.languageSubscription = this.translation.currentLang$.subscribe((lang) => {
      this.updateText(lang);
    });
  }

  get selectedPrefixLabel(): string {
    const match = this.bookPrefixes.find((item) => item.code === this.selectedPrefix);
    if (!match) {
      return this.uiText.noPrefix;
    }

    return match.code ? match.display : this.uiText.noPrefix;
  }

  togglePrefixDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.prefixDropdownOpen = !this.prefixDropdownOpen;
  }

  selectPrefix(prefix: BookPrefixOption) {
    this.selectedPrefix = prefix.code;
    this.prefixDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.prefixDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapePress() {
    this.prefixDropdownOpen = false;
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  searchBook() {
    console.log('Searching for book:', this.selectedPrefix, this.bookCode);
    // Implement search functionality
  }

  private updateText(lang: LanguageCode) {
    const text = this.translation.snapshot(
      [
        'search.title',
        'search.subtitle',
        'search.placeholder',
        'search.button',
        'search.codeLabel',
        'search.codeFallback',
        'gallery.title',
        'gallery.floor',
        'gallery.section',
        'gallery.shelf',
        'search.noPrefix'
      ],
      lang
    );

    this.uiText = {
      title: text['search.title'],
      subtitle: text['search.subtitle'],
      placeholder: text['search.placeholder'],
      searchButton: text['search.button'],
      codeLabel: text['search.codeLabel'],
      codeFallback: text['search.codeFallback'],
      galleryTitle: text['gallery.title'],
      galleryFloor: text['gallery.floor'],
      gallerySection: text['gallery.section'],
      galleryShelf: text['gallery.shelf'],
      noPrefix: text['search.noPrefix']
    };
  }
}
