import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-view-employee',
  templateUrl: './view-employee.page.html',
  styleUrls: ['./view-employee.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class ViewEmployeePage implements OnInit {
  employee: any = null;
  attendance: any[] = [];
  selectedMonth = new Date().toISOString().slice(0, 7);
  loading = true;
  error = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void { this.loadEmployee(); }

  loadEmployee(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${environment.apiUrl}/employee/${id}/attendance?month=${this.selectedMonth}`).subscribe({
      next: (response) => {
        this.employee = response.employee;
        this.attendance = response.attendance;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Unable to load employee details';
        this.loading = false;
      },
    });
  }

  countStatus(status: string): number {
    return this.attendance.filter((item) => item.status === status).length;
  }

  mapLink(item: any): string {
    return `https://maps.google.com/?q=${item.latitude},${item.longitude}`;
  }

  deleteAttendance(item: any): void {
    if (!confirm(`Delete the attendance record for ${item.attendance_date}?`)) return;
    this.http.delete(`${environment.apiUrl}/attendance/${item.id}`).subscribe({
      next: () => this.loadEmployee(),
      error: (err) => alert(err.error?.message || 'Unable to delete attendance record'),
    });
  }
}
