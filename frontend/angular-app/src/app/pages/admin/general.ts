import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

interface BookItem { code: string; title: string; author: string; }

@Component({
  selector: 'app-admin-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './general.html',
  styleUrl: './general.css'
})
export class AdminGeneralComponent {
  query = new FormControl('', { nonNullable: true });
  pattern = /^[A-Z0-9-]+$/i;
  items: BookItem[] = [
    { code: 'BK-0001', title: 'Clean Code', author: 'Robert C. Martin' },
    { code: 'BK-0002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt' },
    { code: 'BK-0100', title: 'Refactoring', author: 'Martin Fowler' },
    { code: 'LIB-9A22', title: 'Domain-Driven Design', author: 'Eric Evans' }
  ];
  get invalidFormat(): boolean {
    const v = this.query.value.trim();
    return v.length > 0 && !this.pattern.test(v);
  }
  get filtered(): BookItem[] {
    const v = this.query.value.trim();
    if (!v) return this.items;
    return this.items.filter(i => i.code.toLowerCase().includes(v.toLowerCase()));
  }
}