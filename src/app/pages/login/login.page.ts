import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';

import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
})
export class LoginPage {

  identifier = '';
  password = '';
  isLoading = false;
  showPassword = false;
  error = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
  ) {}

  login() {
    if (this.isLoading) return;

    this.error = '';
    const identifier = this.identifier.trim();

    if (!identifier || !this.password) {
      this.error = 'Please enter your credentials to continue';
      return;
    }

    this.isLoading = true;

    this.http.post(`${environment.apiUrl}/login`, {
      username: identifier,
      password: this.password,
    }).pipe(
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: (res: any) => {
        if (!res.success || !res.token || !res.user) {
          this.error = 'Invalid response from server';
          return;
        }

        const user = res.user as AuthUser;
        this.auth.setSession(res.token, user);
        this.router.navigateByUrl(user.role === 'ADMIN' ? '/dashboard' : '/entry', {
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Server connection failed. Please try again.';
      },
    });
  }
}
