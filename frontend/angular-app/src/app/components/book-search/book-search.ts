import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BOOK_PREFIXES } from '../../models/book-prefix.model';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './book-search.html',
  styleUrl: './book-search.css'
})
export class BookSearchComponent implements OnInit, AfterViewInit {
  @ViewChild('prefixSelect') prefixSelect!: ElementRef;
  
  bookPrefixes = BOOK_PREFIXES;
  selectedPrefix = '';
  bookCode = '';
  
  ngOnInit() {
    // Initialize component
  }
  
  ngAfterViewInit() {
    // Implementar búsqueda en el select
    if (this.prefixSelect && this.prefixSelect.nativeElement) {
      this.prefixSelect.nativeElement.addEventListener('keydown', this.handleSelectSearch.bind(this));
    }
  }
  
  handleSelectSearch(event: KeyboardEvent) {
    // Solo procesar teclas alfanuméricas
    if (event.key.length === 1 || event.key === 'Backspace') {
      const select = event.target as HTMLSelectElement;
      const searchChar = event.key;
      
      // Buscar la opción que comienza con el carácter presionado
      for (let i = 1; i < select.options.length; i++) {
        if (select.options[i].text.toLowerCase().startsWith(searchChar.toLowerCase())) {
          select.selectedIndex = i;
          this.selectedPrefix = select.value;
          break;
        }
      }
    }
  }

  searchBook() {
    console.log('Searching for book:', this.selectedPrefix, this.bookCode);
    // Implement search functionality
  }
}
