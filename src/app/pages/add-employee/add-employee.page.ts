import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';

import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.page.html',
  styleUrls: ['./add-employee.page.scss'],
  standalone: true,

  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class AddEmployeePage implements OnInit {
  employee = {
    employee_id: '',
    employee_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    password: '',
    address: '',
    office_id: null as number | null,
    profile_image: null as string | null,
  };

  offices: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/offices`).subscribe({
      next: (data) => (this.offices = data || []),
      error: () => (this.offices = []),
    });
  }

  selectPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      alert('Choose a PNG, JPEG or WebP image up to 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.employee.profile_image = String(reader.result);
    reader.readAsDataURL(file);
  }

  saveEmployee() {
    if (!/^\d{10}$/.test(this.employee.phone)) {
      alert('Phone number must contain exactly 10 digits');
      return;
    }
    if (!this.employee.office_id) {
      alert('Please select an office');
      return;
    }

    this.http
      .post(`${environment.apiUrl}/add-employee`, this.employee)
      .subscribe({
        next: () => {
          alert('Employee Saved Successfully');

          this.router.navigate(['/employee']);
        },
        error: (err) => {
          console.log('FULL ERROR', err);
          alert(JSON.stringify(err));
        },
      });
  }

  resetForm() {
    this.employee = {
      employee_id: '',
      employee_name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      password: '',
      address: '',
      office_id: null,
      profile_image: null,
    };
  }

  
}
