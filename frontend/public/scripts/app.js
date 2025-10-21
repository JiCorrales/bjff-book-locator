import { BOOK_PREFIXES } from './bookPrefixes.js';

const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const prefixSelect = document.getElementById('book-prefix');
const THEME_KEY = 'book-locator-theme';

function populatePrefixes() {
  if (!prefixSelect) return;
  prefixSelect.innerHTML = '';
  BOOK_PREFIXES.forEach(({ code, display }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = display;
    prefixSelect.append(option);
  });
}

function applyTheme(theme) {
  if (!themeToggle) return;

  if (theme === 'light') {
    body.classList.add('light-theme');
    themeToggle.innerHTML = '<span aria-hidden="true">🌞</span> Tema';
    themeToggle.setAttribute('aria-pressed', 'true');
  } else {
    body.classList.remove('light-theme');
    themeToggle.innerHTML = '<span aria-hidden="true">🌙</span> Tema';
    themeToggle.setAttribute('aria-pressed', 'false');
  }
}

populatePrefixes();

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) {
  applyTheme(savedTheme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });
}
