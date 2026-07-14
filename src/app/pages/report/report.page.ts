import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar.component';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ReportRow {
  id: string;
  name: string;
  statuses: string[];
  present: number;
  late: number;
  absent: number;
  leave: number;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent, AdminNavbarComponent],
})
export class ReportPage implements OnInit {
  selectedMonth = new Date().toISOString().slice(0, 7);
  days: Array<{ date: number; day: string }> = [];
  rows: ReportRow[] = [];
  loading = true;
  error = '';
  exporting = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadReport(); }

  loadReport(): void {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${environment.apiUrl}/reports/monthly?month=${this.selectedMonth}`).subscribe({
      next: (response) => {
        this.buildReport(response.employees, response.attendance);
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Unable to load report';
        this.loading = false;
      },
    });
  }

  async exportToExcel(): Promise<void> {
    if (this.exporting || this.rows.length === 0) return;
    this.exporting = true;
    try {
      const header = [
        'Employee ID', 'Name',
        ...this.days.map((d) => `${d.date} ${d.day}`),
        'Present', 'Late', 'Absent', 'Leave', 'Total',
      ];
      const data = this.rows.map((r) => [
        r.id, r.name,
        ...r.statuses.map((s) => s || '-'),
        r.present, r.late, r.absent, r.leave,
        r.present + r.late + r.absent + r.leave,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, this.selectedMonth);
      const filename = `attendance-report-${this.selectedMonth}.xlsx`;

      if (Capacitor.isNativePlatform()) {
        const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        await Share.share({
          title: 'Attendance Report',
          text: `Monthly attendance report — ${this.selectedMonth}`,
          url: result.uri,
          dialogTitle: 'Export attendance report',
        });
      } else {
        XLSX.writeFile(workbook, filename);
      }
    } catch (err: any) {
      alert(err?.message || 'Unable to export the report');
    } finally {
      this.exporting = false;
    }
  }

  attendanceRate(row: ReportRow): number {
    const total = row.present + row.late + row.absent + row.leave;
    return total ? Math.round(((row.present + row.late) / total) * 100) : 0;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'P': return 's-present';
      case 'L': return 's-late';
      case 'V': return 's-leave';
      case 'A': return 's-absent';
      default: return 's-none';
    }
  }

  private buildReport(employees: any[], attendance: any[]): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const dayCount = new Date(year, month, 0).getDate();
    this.days = Array.from({ length: dayCount }, (_, index) => {
      const date = index + 1;
      return { date, day: new Date(year, month - 1, date).toLocaleDateString('en-US', { weekday: 'short' }) };
    });

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const cutoff = isCurrentMonth ? today.getDate() : dayCount;

    this.rows = employees.map((employee) => {
      const records = new Map<number, string>();
      attendance.filter((item) => item.employee_id === employee.employee_id).forEach((item) => {
        const day = Number(String(item.attendance_date).slice(8, 10));
        records.set(day, item.status === 'Late' ? 'L' : item.status === 'Leave' ? 'V' : 'P');
      });
      const statuses = this.days.map((day) => records.get(day.date) || (day.date <= cutoff ? 'A' : ''));
      return {
        id: employee.employee_id,
        name: employee.employee_name,
        statuses,
        present: statuses.filter((value) => value === 'P').length,
        late: statuses.filter((value) => value === 'L').length,
        absent: statuses.filter((value) => value === 'A').length,
        leave: statuses.filter((value) => value === 'V').length,
      };
    });
  }
}
