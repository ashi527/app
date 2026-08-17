import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-employee',
  templateUrl: './edit-employee.page.html',
  styleUrls: ['./edit-employee.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    AdminNavbarComponent,
  ],
})
export class EditEmployeePage implements OnInit {
  employee: any = null;
  loading = true;
  saving = false;
  error = '';
  offices: any[] = [];
  departments: any[] = [];
  private employeeRecordId = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.employeeRecordId = this.route.snapshot.paramMap.get('id') || '';
    this.http.get<any[]>(`${environment.apiUrl}/offices`).subscribe({
      next: (data) => (this.offices = data || []),
      error: () => (this.offices = []),
    });

    this.http.get<any[]>(`${environment.apiUrl}/offices`).subscribe({
      next: (data) => (this.departments = data || []),
      error: () => (this.departments = []),
    });
    this.http.get<any[]>(`${environment.apiUrl}/departments`).subscribe({
      next: (data) => (this.departments = data || []),
      error: () => (this.departments = []),
    });
    this.http
      .get<any>(`${environment.apiUrl}/employee/${this.employeeRecordId}`)
      .subscribe({
        next: (employee) => {
          this.employee = { ...employee, password: '' };
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Unable to load employee';
          this.loading = false;
        },
      });
  }

  selectPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      alert('Choose a PNG, JPEG or WebP image up to 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => (this.employee.profile_image = String(reader.result));
    reader.readAsDataURL(file);
  }

  updateEmployee(): void {
    if (!/^\d{10}$/.test(this.employee.phone || '')) {
      alert('Phone number must contain exactly 10 digits');
      return;
    }
    this.saving = true;
    this.http
      .put(
        `${environment.apiUrl}/employee/${this.employeeRecordId}`,
        this.employee
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/employee']);
        },
        error: (error) => {
          this.saving = false;
          alert(error.error?.message || 'Unable to update employee');
        },
      });
  }
}
