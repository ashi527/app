import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class ChangePasswordPage {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  changing = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
  ) {}

  get isAdmin(): boolean {
    return this.auth.user?.role === 'ADMIN';
  }

  changePassword(): void {
    const current = this.currentPassword.trim();
    const next = this.newPassword.trim();
    const confirm = this.confirmPassword.trim();

    if (!current || !next || !confirm) {
      alert('Please fill the current, new and confirm password fields');
      return;
    }
    if (next.length < 4) {
      alert('New password must be at least 4 characters');
      return;
    }
    if (next !== confirm) {
      alert('New password and confirm password do not match');
      return;
    }
    if (next === current) {
      alert('New password must be different from the current password');
      return;
    }

    this.changing = true;
    this.http.put<any>(`${environment.apiUrl}/profile/password`, {
      current_password: current,
      new_password: next,
    }).subscribe({
      next: () => {
        this.changing = false;
        alert('Password updated successfully');
        this.router.navigateByUrl('/profile');
      },
      error: (err) => {
        this.changing = false;
        alert(err.error?.message || 'Unable to update password');
      },
    });
  }
}
