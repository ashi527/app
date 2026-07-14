import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Geolocation } from '@capacitor/geolocation';

interface DashboardEmployee {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string | null;
  location: string | null;
  attendance_days: number;
  present_days: number;
  late_days: number;
  leave_days: number;
  working_hours: number;
  current_location: string | null;
  today_check_in: string | null;
  today_check_out: string | null;
  profile_image: string | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class DashboardPage implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = '';
  private clockTimer: any;

  stats = { total: 0, present: 0, absent: 0, on_leave: 0 };
  employees: DashboardEmployee[] = [];
  filteredEmployees: DashboardEmployee[] = [];
  search = '';
  department = '';
  loading = true;
  error = '';

  offices: any[] = [];
  showOfficeModal = false;
  savingOffice = false;
  locating = false;
  officeError = '';
  officeForm: { id: number | null; name: string; latitude: any; longitude: any; radius: any } = {
    id: null, name: '', latitude: '', longitude: '', radius: 50,
  };

  constructor(private http: HttpClient, private router: Router, private auth: AuthService, private zone: NgZone) {}

  get adminName(): string {
    return this.auth.user?.username || 'Admin';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadOffices();
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
    this.currentDate = now.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  loadOffices(): void {
    this.http.get<any[]>(`${environment.apiUrl}/offices`).subscribe({
      next: (data) => (this.offices = data),
      error: () => (this.offices = []),
    });
  }

  openOfficeModal(office?: any): void {
    this.officeError = '';
    this.officeForm = office
      ? { id: office.id, name: office.name, latitude: office.latitude, longitude: office.longitude, radius: office.radius }
      : { id: null, name: '', latitude: '', longitude: '', radius: 50 };
    this.showOfficeModal = true;
  }

  closeOfficeModal(): void {
    this.showOfficeModal = false;
  }

  async useCurrentLocation(): Promise<void> {
    this.locating = true;
    try {
      let granted = true;
      try {
        let status = await Geolocation.checkPermissions();
        if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
          status = await Geolocation.requestPermissions();
        }
        granted = status.location === 'granted' || status.coarseLocation === 'granted';
      } catch {
        granted = true;
      }

      if (!granted) {
        this.zone.run(() => (this.locating = false));
        alert('Location permission is required. Please allow location access.');
        return;
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      this.zone.run(() => {
        this.officeForm.latitude = Number(position.coords.latitude.toFixed(7));
        this.officeForm.longitude = Number(position.coords.longitude.toFixed(7));
        this.locating = false;
      });
    } catch (error) {
      this.zone.run(() => (this.locating = false));
      alert('Unable to fetch current location. Please allow location access.');
    }
  }

  saveOffice(): void {
    const name = (this.officeForm.name || '').trim();
    const latitude = Number(this.officeForm.latitude);
    const longitude = Number(this.officeForm.longitude);
    const radius = this.officeForm.radius === '' || this.officeForm.radius == null ? 50 : Number(this.officeForm.radius);

    if (!name) { this.officeError = 'Office name is required'; return; }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) { this.officeError = 'Enter a valid latitude'; return; }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) { this.officeError = 'Enter a valid longitude'; return; }
    if (!Number.isFinite(radius) || radius < 1) { this.officeError = 'Radius must be at least 1 metre'; return; }

    this.savingOffice = true;
    const payload = { name, latitude, longitude, radius };
    const request = this.officeForm.id
      ? this.http.put(`${environment.apiUrl}/offices/${this.officeForm.id}`, payload)
      : this.http.post(`${environment.apiUrl}/offices`, payload);

    request.subscribe({
      next: () => { this.savingOffice = false; this.showOfficeModal = false; this.loadOffices(); },
      error: (err) => { this.savingOffice = false; this.officeError = err.error?.message || 'Unable to save office'; },
    });
  }

  deleteOffice(office: any): void {
    if (!confirm(`Delete office "${office.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/offices/${office.id}`).subscribe({
      next: () => this.loadOffices(),
      error: (err) => alert(err.error?.message || 'Unable to delete office'),
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (response) => {
        this.stats = response.stats;
        this.employees = response.employees.map((item: DashboardEmployee) => ({
          ...item,
          attendance_days: Number(item.attendance_days),
          present_days: Number(item.present_days),
          late_days: Number(item.late_days),
          leave_days: Number(item.leave_days),
          working_hours: Number(item.working_hours),
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Unable to load dashboard data';
        this.loading = false;
      },
    });
  }

  get departments(): string[] {
    return [...new Set(this.employees.map((item) => item.department).filter((value): value is string => !!value))];
  }

  applyFilters(): void {
    const query = this.search.trim().toLowerCase();
    this.filteredEmployees = this.employees.filter((employee) =>
      (!query || employee.employee_name.toLowerCase().includes(query) || employee.employee_id.toLowerCase().includes(query)) &&
      (!this.department || employee.department === this.department),
    );
  }

  attendancePercent(employee: DashboardEmployee): number {
    if (!employee.attendance_days) return 0;
    return Math.round(((employee.present_days + employee.late_days) / employee.attendance_days) * 100);
  }

  openMenuId: number | null = null;

  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  viewEmployee(id: number): void { this.closeMenu(); this.router.navigate(['/view-employee', id]); }
  editEmployee(id: number): void { this.closeMenu(); this.router.navigate(['/edit-employee', id]); }

  deleteEmployee(id: number): void {
    this.closeMenu();
    if (!confirm('Delete this employee?')) return;
    this.http.delete(`${environment.apiUrl}/employee/${id}`).subscribe({
      next: () => this.loadDashboard(),
      error: (error) => alert(error.error?.message || 'Unable to delete employee'),
    });
  }
}
