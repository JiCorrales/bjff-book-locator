import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';

interface ActivityEntry { action: 'create' | 'update' | 'delete'; at: string; details?: string }
interface UserItem { id: number; name: string; phone: string; position: string; status: 'Active' | 'Inactive'; activity: string; history: ActivityEntry[] }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class AdminUsersComponent {
  users: UserItem[] = [
    { id: 1, name: 'Andrew Bojangles', phone: '+7900001001', position: 'Designer', status: 'Active', activity: '2 days ago', history: [
      { action: 'create', at: new Date(Date.now()-1000*60*60*24*10).toLocaleString(), details: 'Usuario creado por admin' },
      { action: 'update', at: new Date(Date.now()-1000*60*60*24*2).toLocaleString(), details: 'Actualización de teléfono' },
    ] },
    { id: 2, name: 'Jane Doe', phone: '+7900001002', position: 'Developer', status: 'Inactive', activity: '4 days ago', history: [
      { action: 'create', at: new Date(Date.now()-1000*60*60*24*14).toLocaleString(), details: 'Usuario creado por admin' },
      { action: 'update', at: new Date(Date.now()-1000*60*60*24*4).toLocaleString(), details: 'Cambio de estado a Inactive' },
    ] }
  ];

  form: FormGroup;
  editingId: number | null = null;
  filter = '';
  page = 1;
  pageSize = 5;
  showHistoryFor: UserItem | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,14}$/)]],
      position: ['', Validators.required],
      status: ['Active', Validators.required]
    });
  }

  get filtered() {
    const q = this.filter.toLowerCase();
    const data = q ? this.users.filter(u => u.name.toLowerCase().includes(q)) : this.users;
    const start = (this.page - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.max(1, Math.ceil((this.filter ? this.users.filter(u=>u.name.toLowerCase().includes(this.filter.toLowerCase())).length : this.users.length) / this.pageSize)); }

  submit() {
    if (this.form.invalid) return;
    const id = Math.max(0, ...this.users.map(u=>u.id)) + 1;
    const now = new Date();
    const created: UserItem = { id, activity: now.toLocaleString(), history: [ { action: 'create', at: now.toLocaleString(), details: 'Creación de usuario' } ], ...(this.form.value as any) };
    this.users.unshift(created);
    this.form.reset({ status: 'Active' });
  }

  startEdit(u: UserItem) { this.editingId = u.id; }
  saveEdit(u: UserItem) { this.editingId = null; const t = new Date().toLocaleString(); u.activity = t; u.history.push({ action: 'update', at: t, details: 'Edición de usuario' }); }
  cancelEdit() { this.editingId = null; }
  remove(u: UserItem) {
    if (confirm(`Eliminar a ${u.name}?`)) {
      const t = new Date().toLocaleString();
      u.history.push({ action: 'delete', at: t, details: 'Usuario eliminado' });
      this.users = this.users.filter(x => x.id !== u.id);
    }
  }

  openHistory(u: UserItem) { this.showHistoryFor = u; }
  closeHistory() { this.showHistoryFor = null; }
}