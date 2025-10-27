import { Routes } from '@angular/router';
import { BookSearchComponent } from './components/book-search/book-search';
import { LoginComponent } from './pages/login/login';
import { AdminPage } from './pages/admin/admin';
import { authGuard } from './guards/auth.guard';
import { loginAccessGuard } from './guards/login-access.guard';

export const routes: Routes = [
  { path: '', component: BookSearchComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginAccessGuard] },
  { path: 'admin', component: AdminPage, canActivate: [authGuard], data: { roles: ['admin', 'assistant'] } },
  { path: '**', redirectTo: '' }
];
