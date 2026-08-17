import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Geolocation } from '@capacitor/geolocation';

import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.page.html',
  styleUrls: ['./entry.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class AttendancePage implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = '';

  latitude = 0;
  longitude = 0;

  location = 'Fetching live location...';

  mapUrl!: SafeResourceUrl;
  mapReady = false;

  checkInTime = '--:--';
  checkOutTime = '--:--';

  watchId: string | null = null;
  timer: any;

  employee = {
    id: '',
    name: '',
    designation: '',
    profile_image: null as string | null,
  };

  offices: any[] = [];

  assignedOffice: { name: string; latitude: any; longitude: any; radius: any } | null = null;

  hasCheckedIn = false;
  hasCheckedOut = false;

  private get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get distanceToOffice(): string {
    if (!this.assignedOffice || this.assignedOffice.latitude == null || this.assignedOffice.longitude == null) return '';
    if (!this.latitude || !this.longitude) return 'Locating…';
    const metres = this.distanceInMeters(
      this.latitude, this.longitude,
      Number(this.assignedOffice.latitude), Number(this.assignedOffice.longitude),
    );
    return metres < 1000 ? `${Math.round(metres)} m away` : `${(metres / 1000).toFixed(2)} km away`;
  }

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    const user = this.auth.user;
    if (!user || user.role !== 'EMPLOYEE' || !user.employee_id) {
      this.auth.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.employee = {
      id: user.employee_id,
      name: user.employee_name || user.employee_id,
      designation: user.designation || 'Employee',
      profile_image: user.profile_image || null,
    };

    this.updateDateTime();

    this.timer = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    this.initLocation();

    this.loadOffices();

    this.loadTodayStatus();

    this.loadAssignedOffice();
  }

  loadOffices() {
    this.http.get<any[]>(`${environment.apiUrl}/offices`).subscribe({
      next: (data) => (this.offices = data || []),
      error: () => (this.offices = []),
    });
  }

  loadAssignedOffice() {
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: (p) => {
        if (p && p.office_id && p.office_name) {
          this.assignedOffice = {
            name: p.office_name,
            latitude: p.office_latitude,
            longitude: p.office_longitude,
            radius: p.office_radius,
          };
        }
      },
      error: () => {},
    });
  }

  loadTodayStatus() {
    this.http.get<any[]>(`${environment.apiUrl}/attendance/${this.employee.id}`).subscribe({
      next: (rows) => {
        const today = (rows || []).find((r) => r.attendance_date === this.todayDate);
        if (!today) return;
        if (today.check_in_time) {
          this.checkInTime = today.check_in_time;
          this.hasCheckedIn = true;
        }
        if (today.check_out_time) {
          this.checkOutTime = today.check_out_time;
          this.hasCheckedOut = true;
        }
      },
      error: () => {},
    });
  }

  private distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  private isWithinOffice(): boolean {
    if (!this.offices.length) return true;
    return this.offices.some((office) =>
      this.distanceInMeters(this.latitude, this.longitude, Number(office.latitude), Number(office.longitude))
        <= (Number(office.radius) || 50),
    );
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.watchId !== null) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  updateDateTime() {
    const now = new Date();

    this.currentTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.currentDate = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private async ensureLocationPermission(): Promise<boolean> {
    try {
      let status = await Geolocation.checkPermissions();
      if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
        status = await Geolocation.requestPermissions();
      }
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch {
      return true;
    }
  }

  private applyPosition(lat: number, lng: number) {
    this.zone.run(() => {
      this.latitude = lat;
      this.longitude = lng;
      this.location = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      this.updateMap();
    });
  }

  async initLocation() {
    const granted = await this.ensureLocationPermission();
    if (!granted) {
      this.zone.run(() => (this.location = 'Location Permission Denied'));
      return;
    }

    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      this.applyPosition(pos.coords.latitude, pos.coords.longitude);
    } catch (error) {
      this.zone.run(() => (this.location = 'Unable to fetch location'));
    }

    try {
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (position) => {
          if (position) this.applyPosition(position.coords.latitude, position.coords.longitude);
        },
      );
    } catch {
    }
  }

  updateMap() {
    const mapUrl = `https://maps.google.com/maps?q=${this.latitude},${this.longitude}&z=18&output=embed`;

    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  onMapLoaded() {
    this.zone.run(() => (this.mapReady = true));
  }

  private getDatabaseTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  checkIn() {
    if (this.hasCheckedIn) {
      alert('You are already checked in for today');
      return;
    }
    if (!this.latitude || !this.longitude) {
      alert('Please wait until your live location is available');
      return;
    }

  //  if (!this.isWithinOffice()) {
  //    alert('You are not at an office location. Please go to the office to check in.');
  //    return;
  //  }

    const attendanceData = {
      employee_id: this.employee.id,
      employee_name: this.employee.name,
      attendance_date: this.todayDate,
      check_in_time: this.getDatabaseTime(),
      latitude: this.latitude,
      longitude: this.longitude,
      location: this.location,
    };

    this.http.post(`${environment.apiUrl}/checkin`, attendanceData).subscribe({
      next: (res: any) => {
        this.checkInTime = attendanceData.check_in_time;
        this.hasCheckedIn = true;
        alert('Check In Successful');
      },
      error: (err) => {
        console.log(err);
        if (err.status === 409) this.loadTodayStatus();
        alert(err.error?.message || 'Check In Failed');
      },
    });
  }

  checkOut() {
    if (!this.hasCheckedIn) {
      alert('Please check in before checking out');
      return;
    }
    if (this.hasCheckedOut) {
      alert('You have already checked out for today');
      return;
    }
    if (!this.latitude || !this.longitude) {
      alert('Please wait until your live location is available');
      return;
    }

    // if (!this.isWithinOffice()) {
      // alert('You are not at an office location. Please go to the office to check out.');
      // return;
    // }

    const attendanceData = {
      employee_id: this.employee.id,
      attendance_date: this.todayDate,
      check_out_time: this.getDatabaseTime(),
      latitude: this.latitude,
      longitude: this.longitude,
      location: this.location,
    };

    this.http.post(`${environment.apiUrl}/checkout`, attendanceData).subscribe({
      next: (res: any) => {
        this.checkOutTime = attendanceData.check_out_time;
        this.hasCheckedOut = true;
        alert('Check Out Successful');
      },
      error: (err) => {
        console.log(err);
        if (err.status === 409) this.loadTodayStatus();
        alert(err.error?.message || 'Check Out Failed');
      },
    });
  }
}
