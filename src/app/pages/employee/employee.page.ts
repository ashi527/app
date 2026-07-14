import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    RouterModule,
    AdminNavbarComponent,
  ]
})
export class EmployeePage implements OnInit {

  employees: any[] = [];
  filteredEmployees: any[] = [];
  search = '';
  loading = true;
  error = '';
  openMenuId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.error = '';
    this.http.get<any[]>(
      `${environment.apiUrl}/employees`
    ).subscribe({
      next: (data) => {
        this.employees = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Unable to load employees';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    this.filteredEmployees = !q
      ? this.employees
      : this.employees.filter((e) =>
          (e.employee_name || '').toLowerCase().includes(q) ||
          (e.employee_id || '').toLowerCase().includes(q) ||
          (e.department || '').toLowerCase().includes(q) ||
          (e.email || '').toLowerCase().includes(q));
  }

  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu() {
    this.openMenuId = null;
  }

  viewEmployee(id: number) {
    this.closeMenu();
    this.router.navigate(['/view-employee', id]);
  }

  editEmployee(id: number) {
    this.closeMenu();
    this.router.navigate(['/edit-employee', id]);
  }

  deleteEmployee(id: number) {
    this.closeMenu();
    if (!confirm('Delete this employee?')) return;
    this.http
      .delete(`${environment.apiUrl}/employee/${id}`)
      .subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (err) => alert(err.error?.message || 'Unable to delete employee'),
      });
  }

  goToAddEmployee() {
    this.router.navigate(['/add-employee']);
  }
}
