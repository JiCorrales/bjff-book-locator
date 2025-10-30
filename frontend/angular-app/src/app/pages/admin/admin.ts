import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  constructor(private readonly auth: AuthService) {}
  get canManageUsers() { const role = this.auth.getRole(); return role === 'admin' || role === 'isMaster'; }
  get canManageRangesConfig() { const role = this.auth.getRole(); return role === 'admin' || role === 'isMaster'; }
  get userName() { return this.auth.state().fullName ?? 'Company'; }
}