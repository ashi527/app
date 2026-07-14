import { Routes } from '@angular/router';
import { adminGuard, employeeGuard, authGuard, guestGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'employee',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/employee/employee.page').then((m) => m.EmployeePage),
  },
  {
    path: 'add-employee',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/add-employee/add-employee.page').then((m) => m.AddEmployeePage),
  },
  {
    path: 'report',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/report/report.page').then((m) => m.ReportPage),
  },
  {
    path: 'entry',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/entry/entry.page').then((m) => m.AttendancePage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/change-password/change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'manage-admins',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/manage-admins/manage-admins.page').then((m) => m.ManageAdminsPage),
  },
  {
    path: 'view-employee/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/view-employee/view-employee.page').then((m) => m.ViewEmployeePage),
  },
  {
    path: 'edit-employee/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/edit-employee/edit-employee.page').then((m) => m.EditEmployeePage),
  },
  { path: '**', redirectTo: 'login' },
];
