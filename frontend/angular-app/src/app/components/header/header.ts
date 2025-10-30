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
import { Router } from '@angular/router';
import { LoginAccessService } from '../../services/login-access.service';
import { ThemeService, ThemeName } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
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
    signIn: '',
    signOut: ''
  };
  languageLabels: Record<LanguageCode, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French'
  };
  currentTheme: ThemeName = 'dark';

  private readonly languageSubscription: Subscription;
  private readonly themeSubscription: Subscription;
  private readonly authSubscription: Subscription;
  isLoggedIn = false;

  constructor(
    private host: ElementRef<HTMLElement>,
    private translation: TranslationService,
    private router: Router,
    private loginAccess: LoginAccessService,
    private themeService: ThemeService,
    private auth: AuthService
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

    this.currentTheme = this.themeService.theme;
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });

    this.isLoggedIn = this.auth.isLoggedIn();
    this.authSubscription = toObservable(this.auth.state).subscribe((state) => {
      this.isLoggedIn = state.isAuthenticated;
    });
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
    this.themeService.toggleTheme();
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
    this.themeSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
  }

  private refreshText(lang: LanguageCode) {
    const text = this.translation.snapshot(
      [
        'header.logo',
        'header.about',
        'header.theme',
        'header.signIn',
        'header.signOut',
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
      signIn: text['header.signIn'] || 'Sign in',
      signOut: text['header.signOut'] || 'Sign out'
    };

    this.languageLabels = {
      en: text['language.en'],
      es: text['language.es'],
      fr: text['language.fr']
    };
  }
  handleAuthClick() {
    if (this.isLoggedIn) {
      this.auth.logout();
      this.router.navigate(['/']);
    } else {
      this.loginAccess.grantAccess();
      this.router.navigate(['/login']);
    }
  }
}
