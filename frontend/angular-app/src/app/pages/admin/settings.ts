import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class AdminSettingsComponent {
  groups = [
    { label: 'General', icon: '🏠', open: true, items: ['Branding', 'Localization'] },
    { label: 'Security', icon: '🔒', open: false, items: ['Roles', 'Policies'] },
    { label: 'Integrations', icon: '🔌', open: false, items: ['API Keys', 'Webhooks'] }
  ];
  toggle(i: number) { this.groups[i].open = !this.groups[i].open; }
}