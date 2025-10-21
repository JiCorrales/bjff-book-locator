import { BOOK_PREFIXES } from './bookPrefixes.js';

const body = document.body;
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const languageToggle = document.getElementById('language-toggle');
const themeToggleIcon = themeToggle?.querySelector('.theme-toggle__icon');
const prefixSelect = document.getElementById('book-prefix');
const prefixSearchInput = document.getElementById('prefix-search');
const THEME_KEY = 'book-locator-theme';
const LANGUAGE_KEY = 'book-locator-language';
const DEFAULT_LANGUAGE = 'es';

const TRANSLATIONS = {
  es: {
    'header.brand': 'Ejemplos/Lista de espera',
    'controls.language': 'Idioma',
    'controls.theme': 'Tema',
    'controls.languageToggleLabel': 'Cambiar idioma',
    'header.about': 'Sobre nosotros',
    'header.signIn': 'Iniciar sesión',
    'hero.title': '¡Busca tu libro!',
    'hero.subtitle': 'Ingresa el código del libro',
    'actions.search': 'Buscar',
    'search.sectionLabel': 'Buscador de códigos de libro',
    'search.currentLabel': 'Código actual',
    'search.currentValue': 'Sin código',
    'gallery.title': '¿Dónde encontrar el código?',
    'gallery.placeholderOne': 'Espacio para imagen de ejemplo (portada o lomo)',
    'gallery.placeholderTwo': 'Espacio para imagen de ejemplo (página interior)',
    'inputs.prefixSearch': 'Buscar',
    'inputs.bookPrefix': 'Prefijo del código',
    'inputs.bookCode': 'Ej: 892.w312a',
    'select.noResults': 'Sin coincidencias'
  },
  en: {
    'header.brand': 'Examples/Waitlist',
    'controls.language': 'Language',
    'controls.theme': 'Theme',
    'controls.languageToggleLabel': 'Switch language',
    'header.about': 'About Us',
    'header.signIn': 'Sign in',
    'hero.title': 'Find your book!',
    'hero.subtitle': 'Enter the book code',
    'actions.search': 'Search',
    'search.sectionLabel': 'Book code search',
    'search.currentLabel': 'Current code',
    'search.currentValue': 'No code yet',
    'gallery.title': 'Where is the code?',
    'gallery.placeholderOne': 'Placeholder for sample image (cover or spine)',
    'gallery.placeholderTwo': 'Placeholder for sample image (interior page)',
    'inputs.prefixSearch': 'Search',
    'inputs.bookPrefix': 'Book code prefix',
    'inputs.bookCode': 'Ex: 892.w312a',
    'select.noResults': 'No matches'
  }
};

const i18nElements = document.querySelectorAll('[data-i18n]');
const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
const i18nAriaLabels = document.querySelectorAll('[data-i18n-aria-label]');

const getTranslation = (language, key) => {
  const translations = TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
  return translations[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? '';
};

const getPrefixLabel = (labels, language) => {
  if (!labels) return '';
  return labels[language] ?? labels[DEFAULT_LANGUAGE] ?? Object.values(labels)[0] ?? '';
};

const populatePrefixes = (filterText = '', language = DEFAULT_LANGUAGE) => {
  if (!prefixSelect) return;

  const previousValue = prefixSelect.value;
  const normalizedFilter = filterText.trim().toLowerCase();
  let firstOption = null;
  let hasSelection = false;
  let hasMatch = false;

  prefixSelect.innerHTML = '';

  BOOK_PREFIXES.forEach(({ code, labels }) => {
    const label = getPrefixLabel(labels, language);
    if (
      normalizedFilter &&
      !label.toLowerCase().includes(normalizedFilter) &&
      !code.toLowerCase().includes(normalizedFilter)
    ) {
      return;
    }

    const option = document.createElement('option');
    option.value = code;
    option.textContent = label;

    if (!firstOption) {
      firstOption = option;
    }

    if (code === previousValue) {
      option.selected = true;
      hasSelection = true;
    }

    prefixSelect.append(option);
    hasMatch = true;
  });

  if (!hasMatch) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = getTranslation(language, 'select.noResults');
    option.disabled = true;
    option.selected = true;
    prefixSelect.append(option);
    return;
  }

  if (!hasSelection && firstOption) {
    firstOption.selected = true;
  }
};

const applyTheme = theme => {
  if (!themeToggle) return;

  if (theme === 'light') {
    body.classList.add('light-theme');
    themeToggle.setAttribute('aria-pressed', 'true');
    if (themeToggleIcon) {
      themeToggleIcon.textContent = '🌞';
    }
  } else {
    body.classList.remove('light-theme');
    themeToggle.setAttribute('aria-pressed', 'false');
    if (themeToggleIcon) {
      themeToggleIcon.textContent = '🌙';
    }
  }
};

const applyLanguage = language => {
  const nextLanguage = TRANSLATIONS[language] ? language : DEFAULT_LANGUAGE;
  root.setAttribute('lang', nextLanguage);
  body.setAttribute('lang', nextLanguage);

  i18nElements.forEach(element => {
    const key = element.dataset.i18n;
    element.textContent = getTranslation(nextLanguage, key);
  });

  i18nPlaceholders.forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    const translation = getTranslation(nextLanguage, key);
    if (translation) {
      element.setAttribute('placeholder', translation);
    }
  });

  if (languageToggle) {
    languageToggle.setAttribute(
      'aria-label',
      getTranslation(nextLanguage, 'controls.languageToggleLabel')
    );
  }

  i18nAriaLabels.forEach(element => {
    const key = element.dataset.i18nAriaLabel;
    const translation = getTranslation(nextLanguage, key);
    if (translation) {
      element.setAttribute('aria-label', translation);
    }
  });

  populatePrefixes(prefixSearchInput?.value ?? '', nextLanguage);

  return nextLanguage;
};

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  applyTheme(savedTheme);
}

let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
currentLanguage = applyLanguage(currentLanguage);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });
}

if (languageToggle) {
  languageToggle.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'es' ? 'en' : 'es';
    currentLanguage = applyLanguage(currentLanguage);
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  });
}

if (prefixSearchInput) {
  prefixSearchInput.addEventListener('input', event => {
    const value = event.target.value;
    populatePrefixes(value, currentLanguage);
  });
}
