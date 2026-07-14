import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class ProfilePage implements OnInit {
  profile: any = null;
  loading = true;
  saving = false;
  error = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  get isAdmin(): boolean {
    return this.auth.user?.role === 'ADMIN';
  }

  get backLink(): string {
    return this.isAdmin ? '/dashboard' : '/entry';
  }

  get initial(): string {
    const name: string = this.profile?.employee_name || this.profile?.username || '';
    return name.charAt(0).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to load profile';
        this.loading = false;
      },
    });
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      alert('Choose a PNG, JPEG or WebP image up to 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const profile_image = String(reader.result);
      this.http.put<any>(`${environment.apiUrl}/profile/photo`, { profile_image }).subscribe({
        next: () => {
          this.profile.profile_image = profile_image;
          this.auth.updateUser({ profile_image });
        },
        error: (err) => alert(err.error?.message || 'Unable to update profile photo'),
      });
    };
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    if (!this.isAdmin && !/^\d{10}$/.test(this.profile.phone || '')) {
      alert('Phone number must contain exactly 10 digits');
      return;
    }

    this.saving = true;
    const payload: any = { ...this.profile };
    delete payload.profile_image;

    this.http.put<any>(`${environment.apiUrl}/profile`, payload).subscribe({
      next: () => {
        this.saving = false;
        if (!this.isAdmin) {
          this.auth.updateUser({
            employee_name: this.profile.employee_name,
            designation: this.profile.designation,
          });
        }
        alert('Profile updated successfully');
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Unable to update profile');
      },
    });
  }
}
