import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminPage {
  menuOpen = {
    users: true,
    ranges: true,
  };
  toggle(section: 'users'|'ranges') { this.menuOpen[section] = !this.menuOpen[section]; }
}