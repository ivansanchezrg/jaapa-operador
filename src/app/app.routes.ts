import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'captura',
    loadComponent: () => import('./pages/captura/captura.page').then((m) => m.CapturaPage),
    canActivate: [authGuard],
  },
  {
    path: 'pendientes',
    loadComponent: () => import('./pages/pendientes/pendientes.page').then((m) => m.PendientesPage),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
