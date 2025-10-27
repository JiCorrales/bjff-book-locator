import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoginAccessService {
  private allowed = false;

  grantAccess(): void {
    this.allowed = true;
  }

  // Consume el permiso para que no se pueda acceder directamente por URL
  consumeAccess(): boolean {
    const ok = this.allowed;
    this.allowed = false;
    return ok;
  }

  canAccess(): boolean {
    return this.allowed;
  }
}