import { Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BOOK_PREFIXES, BookPrefixOption } from '../../models/book-prefix.model';
import { TranslationService, LanguageCode } from '../../services/translation.service';
import { BookLocatorService, SearchBookResponse, ShelfLocation } from '../../services/book-locator.service';
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

  // Search results
  searchResult: SearchBookResponse | null = null;
  shelfImageUrl: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

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
    private translation: TranslationService,
    private bookLocatorService: BookLocatorService
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
    // Reset previous results
    this.errorMessage = null;
    this.searchResult = null;
    this.shelfImageUrl = null;

    // Validate input
    const fullCode = this.selectedPrefix
      ? `${this.selectedPrefix} ${this.bookCode}`.trim()
      : this.bookCode.trim();

    if (!fullCode) {
      this.errorMessage = 'Please enter a book code';
      return;
    }

    // Start loading
    this.isLoading = true;

    // Call backend API
    this.bookLocatorService.searchBook(fullCode).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.searchResult = response;

        // Get image URL if available
        if (response.location.shelf_image_path) {
          this.shelfImageUrl = this.bookLocatorService.getShelfImageUrl(
            response.location.shelf_image_path
          );
        }

        console.log('Book found:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'An error occurred while searching';
        console.error('Search error:', error);
      }
    });
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
