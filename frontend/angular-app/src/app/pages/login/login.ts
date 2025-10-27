import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  async submit() {
    this.error = '';
    this.loading = true;
    const ok = await this.auth.login(this.username.trim(), this.password);
    this.loading = false;
    if (!ok) {
      this.error = 'Credenciales inválidas o rol no permitido';
      return;
    }
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    this.router.navigate([redirect || '/admin']);
  }
}