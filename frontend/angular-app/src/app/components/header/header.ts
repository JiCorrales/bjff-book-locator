import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  TranslationService,
  LanguageCode
} from '../../services/translation.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router'

interface LanguageOption {
  code: LanguageCode;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnDestroy {
  languages: LanguageOption[] = [
    { code: 'en' },
    { code: 'es' },
    { code: 'fr' }
  ];

  selectedLanguage: LanguageOption = this.languages[0];
  languageDropdownOpen = false;
  uiText = {
    logo: '',
    about: '',
    theme: '',
    signIn: ''
  };
  languageLabels: Record<LanguageCode, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French'
  };

  private readonly languageSubscription: Subscription;

  constructor(
    private host: ElementRef<HTMLElement>,
    private translation: TranslationService,
    private router: Router
  ) {
    const initial = this.translation.currentLang;
    this.selectedLanguage =
      this.languages.find((lang) => lang.code === initial) ?? this.languages[0];

    this.refreshText(initial);
    this.languageSubscription = this.translation.currentLang$.subscribe(
      (lang) => {
        this.selectedLanguage =
          this.languages.find((item) => item.code === lang) ??
          this.selectedLanguage;
        this.refreshText(lang);
      }
    );
  }

  get selectedLanguageCode(): string {
    return this.selectedLanguage.code.toUpperCase();
  }

  get selectedLanguageName(): string {
    return this.languageLabels[this.selectedLanguage.code];
  }

  toggleLanguageDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.languageDropdownOpen = !this.languageDropdownOpen;
  }

  selectLanguage(language: LanguageOption) {
    this.translation.setLanguage(language.code);
    this.languageDropdownOpen = false;
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.languageDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapePress() {
    this.languageDropdownOpen = false;
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private refreshText(lang: LanguageCode) {
    const text = this.translation.snapshot(
      [
        'header.logo',
        'header.about',
        'header.theme',
        'header.signIn',
        'language.en',
        'language.es',
        'language.fr'
      ],
      lang
    );

    this.uiText = {
      logo: text['header.logo'],
      about: text['header.about'],
      theme: text['header.theme'],
      signIn: text['header.signIn']
    };

    this.languageLabels = {
      en: text['language.en'],
      es: text['language.es'],
      fr: text['language.fr']
    };
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
