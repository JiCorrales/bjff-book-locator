import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService, ThemeName } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  error = '';
  loading = false;
  enableHint = 'Ingresa correo y contraseña válidos para habilitar el botón';
  private emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private criteriaMet = false;
  currentTheme: ThemeName = 'dark';
  private themeSubscription?: Subscription;

  get buttonDisabled(): boolean {
    return this.loading || !this.criteriaMet;
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.theme;
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  onFieldChange(field: 'email' | 'password', value: string) {
    if (field === 'email') this.email = value;
    if (field === 'password') this.password = value;
    this.updateEnableState();
  }

  private updateEnableState() {
    const mail = this.email.trim();
    const pass = this.password.trim();

    const emailValid = this.emailPattern.test(mail);
    const passwordMinLenOk = pass.length >= 6;

    this.criteriaMet = emailValid && passwordMinLenOk;

    if (!mail) {
      this.enableHint = 'Escribe tu correo para continuar';
    } else if (!emailValid) {
      this.enableHint = 'El correo electrónico no tiene un formato válido';
    } else if (!pass) {
      this.enableHint = 'Escribe tu contraseña para continuar';
    } else if (!passwordMinLenOk) {
      this.enableHint = 'La contraseña debe tener al menos 6 caracteres';
    } 
  }

  async submit() {
    this.error = '';
    this.loading = true;

    const result = await this.auth.login(this.email.trim(), this.password);
    this.loading = false;

    if (!result.ok) {
      this.error = result.message ?? 'Credenciales inválidas';
      return;
    }

    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigate([redirect || '/admin']);
  }
}
