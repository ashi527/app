import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';

interface AdminRow {
  id: number;
  username: string;
  profile_image: string | null;
  created_at: string;
  is_self: boolean;
}

@Component({
  selector: 'app-manage-admins',
  templateUrl: './manage-admins.page.html',
  styleUrls: ['./manage-admins.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class ManageAdminsPage implements OnInit {
  admins: AdminRow[] = [];
  loading = true;
  error = '';

  newUsername = '';
  newPassword = '';
  creating = false;

  editingId: number | null = null;
  editUsername = '';
  editPassword = '';
  saving = false;

  constructor(private http: HttpClient) {}

  private get api(): string {
    return `${environment.apiUrl}/admins`;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(this.api).subscribe({
      next: (res) => {
        this.admins = (res.admins || []).sort(
          (a: AdminRow, b: AdminRow) => Number(a.is_self) - Number(b.is_self),
        );
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to load admins';
        this.loading = false;
      },
    });
  }

  createAdmin(): void {
    const username = this.newUsername.trim();
    const password = this.newPassword.trim();
    if (!username || !password) {
      alert('Enter a username and password');
      return;
    }
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }

    this.creating = true;
    this.http.post<any>(this.api, { username, password }).subscribe({
      next: () => {
        this.creating = false;
        this.newUsername = '';
        this.newPassword = '';
        this.load();
      },
      error: (err) => {
        this.creating = false;
        alert(err.error?.message || 'Unable to create admin');
      },
    });
  }

  startEdit(admin: AdminRow): void {
    this.editingId = admin.id;
    this.editUsername = admin.username;
    this.editPassword = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editUsername = '';
    this.editPassword = '';
  }

  saveEdit(admin: AdminRow): void {
    const username = this.editUsername.trim();
    const password = this.editPassword.trim();
    if (!username) {
      alert('Username is required');
      return;
    }
    if (password && password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }

    this.saving = true;
    const payload: any = { username };
    if (password) payload.password = password;

    this.http.put<any>(`${this.api}/${admin.id}`, payload).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Unable to update admin');
      },
    });
  }

  deleteAdmin(admin: AdminRow): void {
    if (admin.is_self) return;
    if (!confirm(`Delete admin "${admin.username}"? This cannot be undone.`)) return;

    this.http.delete<any>(`${this.api}/${admin.id}`).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.message || 'Unable to delete admin'),
    });
  }

  initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }
}
