import { Routes } from '@angular/router';
// import { HomePage } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { AdminPage } from './pages/admin/admin';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
 // { path: '', component: HomePage },
  //{ path: 'login', component: LoginComponent },
 // { path: 'admin', component: AdminPage, canActivate: [authGuard], data: { roles: ['admin', 'assistant'] } },
];
