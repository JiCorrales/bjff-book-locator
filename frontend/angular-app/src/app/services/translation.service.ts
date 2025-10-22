import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LanguageCode = 'en' | 'es' | 'fr';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly translations: Record<LanguageCode, Record<string, string>> = {
    en: {
      'header.logo': 'Book Locator',
      'header.about': 'About Us',
      'header.theme': 'Theme',
      'header.signIn': 'Sign in',
      'language.en': 'English',
      'language.es': 'Spanish',
      'language.fr': 'French',
      'search.title': 'Find Your Book',
      'search.subtitle': 'Current code',
      'search.placeholder': 'Enter book code...',
      'search.button': 'Search',
      'search.codeLabel': 'Code',
      'search.codeFallback': 'N/A',
      'search.noPrefix': 'No prefix',
      'gallery.title': 'Book Location',
      'gallery.floor': 'Floor Map',
      'gallery.section': 'Section View',
      'gallery.shelf': 'Shelf Close-up'
    },
    es: {
      'header.logo': 'Buscador de Libros',
      'header.about': 'Nosotros',
      'header.theme': 'Tema',
      'header.signIn': 'Iniciar sesion',
      'language.en': 'Ingles',
      'language.es': 'Espanol',
      'language.fr': 'Frances',
      'search.title': 'Encuentra tu libro',
      'search.subtitle': 'Codigo actual',
      'search.placeholder': 'Ingresa el codigo del libro...',
      'search.button': 'Buscar',
      'search.codeLabel': 'Codigo',
      'search.codeFallback': 'N/D',
      'search.noPrefix': 'Sin prefijo',
      'gallery.title': 'Ubicacion del libro',
      'gallery.floor': 'Mapa del piso',
      'gallery.section': 'Vista de seccion',
      'gallery.shelf': 'Detalle del estante'
    },
    fr: {
      'header.logo': 'Localisateur de livres',
      'header.about': 'A propos',
      'header.theme': 'Theme',
      'header.signIn': 'Connexion',
      'language.en': 'Anglais',
      'language.es': 'Espagnol',
      'language.fr': 'Francais',
      'search.title': 'Trouvez votre livre',
      'search.subtitle': 'Code actuel',
      'search.placeholder': 'Saisissez le code du livre...',
      'search.button': 'Rechercher',
      'search.codeLabel': 'Code',
      'search.codeFallback': 'N/A',
      'search.noPrefix': 'Sans prefixe',
      'gallery.title': 'Localisation du livre',
      'gallery.floor': 'Plan d\'etage',
      'gallery.section': 'Vue de section',
      'gallery.shelf': 'Detail de l\'etagere'
    }
  };

  private readonly currentLangSubject = new BehaviorSubject<LanguageCode>('en');
  readonly currentLang$ = this.currentLangSubject.asObservable();

  get currentLang(): LanguageCode {
    return this.currentLangSubject.value;
  }

  setLanguage(code: LanguageCode) {
    if (!this.translations[code]) {
      return;
    }

    if (this.currentLangSubject.value !== code) {
      this.currentLangSubject.next(code);
    }
  }

  translate(key: string, lang: LanguageCode = this.currentLang): string {
    return this.snapshot([key], lang)[key];
  }

  snapshot(keys: string[], lang: LanguageCode = this.currentLang): Record<string, string> {
    const fallback = this.translations.en;
    const selected = this.translations[lang] ?? fallback;
    const result: Record<string, string> = {};

    for (const key of keys) {
      result[key] = selected[key] ?? fallback[key] ?? key;
    }

    return result;
  }
}
