import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' }
  ];
  
  selectedLanguage = this.languages[0];
  languageDropdown = false;
  
  toggleTheme() {
    document.body.classList.toggle('light-theme');
  }
  
  changeLanguage(lang: any) {
    this.selectedLanguage = lang;
    console.log('Language changed to:', lang.code);
  }
}
