import { Routes } from '@angular/router';
import { BookSearchComponent } from './components/book-search/book-search';
import { LoginComponent } from './pages/login/login';
import { AdminPage } from './pages/admin/admin';
import { AdminUsersComponent } from './pages/admin/users';
import { AdminRangesViewComponent } from './pages/admin/ranges-view';
import { AdminRangesConfigComponent } from './pages/admin/ranges-config';
import { FurnitureConfigComponent } from './pages/admin/furniture-config';
import { authGuard } from './guards/auth.guard';
import { loginAccessGuard } from './guards/login-access.guard';

export const routes: Routes = [
  { path: '', component: BookSearchComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginAccessGuard] },
  { path: 'admin', component: AdminPage, canActivate: [authGuard], data: { roles: ['admin', 'assistant', 'isMaster'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ranges' },
      { path: 'ranges', component: AdminRangesViewComponent },
      { path: 'ranges-config', component: AdminRangesConfigComponent, canActivate: [authGuard], data: { roles: ['admin', 'isMaster'] } },
      { path: 'furniture-config/:id', component: FurnitureConfigComponent, canActivate: [authGuard], data: { roles: ['admin', 'isMaster'] } },
      { path: 'users', component: AdminUsersComponent, canActivate: [authGuard], data: { roles: ['admin', 'isMaster'] } },
      { path: '**', redirectTo: 'ranges' }
    ]
  },
  { path: '**', redirectTo: '' }
];
