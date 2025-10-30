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
  username = '';
  password = '';
  error = '';
  loading = false;
  enableHint = 'Ingresa usuario y contraseA�a vA�lidos para habilitar el botA3n';
  private usernamePattern = /^[A-Za-z0-9._-]+$/;
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
    console.debug('[LoginComponent] Initial theme detected:', this.currentTheme);
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
      console.debug('[LoginComponent] Theme change received:', theme);
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  onFieldChange(field: 'username' | 'password', value: string) {
    // Normaliza espacios
    if (field === 'username') this.username = value;
    if (field === 'password') this.password = value;
    this.updateEnableState();
  }

  private updateEnableState() {
    const u = this.username.trim();
    const p = this.password.trim();

    const usernameHasChar = u.length >= 1;
    const usernameFormatOk = this.usernamePattern.test(u);
    const passwordHasChar = p.length >= 1;
    const passwordMinLenOk = p.length >= 6; // requisitos bA�sicos del formulario

    this.criteriaMet = usernameHasChar && usernameFormatOk && passwordHasChar && passwordMinLenOk;

    if (!usernameHasChar) {
      this.enableHint = 'Escribe tu usuario para continuar';
    } else if (!usernameFormatOk) {
      this.enableHint = 'El usuario solo puede contener letras, nA�meros, . _ -';
    } else if (!passwordHasChar) {
      this.enableHint = 'Escribe tu contraseA�a para continuar';
    } else if (!passwordMinLenOk) {
      this.enableHint = 'La contraseA�a debe tener al menos 6 caracteres';
    } else {
      this.enableHint = 'Listo: el botA3n se habilitarA� automA�ticamente';
    }
  }

  async submit() {
    this.error = '';
    this.loading = true;
    const ok = await this.auth.login(this.username.trim(), this.password);
    this.loading = false;
    if (!ok) {
      this.error = 'Credenciales invA�lidas o rol no permitido';
      return;
    }
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigate([redirect || '/admin']);
  }
}
