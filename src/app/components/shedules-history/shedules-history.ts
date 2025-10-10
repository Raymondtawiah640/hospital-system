import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shedules-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './shedules-history.html',
  styleUrls: ['./shedules-history.css']
})
export class ShedulesHistory implements OnInit {
  appointments: any[] = [];
  selectedAppointment: any = null;

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isLoggedIn: boolean = false;

  private messageTimer: any; // 🔹 Timer for clearing messages

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn){
      this.router.navigate(['/login']);
    }else {
      this.loadAppointments();
    }
  }

  // 🔹 Show message with auto-clear
  private showMessage(message: string, type: 'success' | 'error' = 'success', duration: number = 3000) {
    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = '';
    } else {
      this.errorMessage = message;
      this.successMessage = '';
    }

    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, duration);
  }

  // ✅ Load all appointment history
  loadAppointments(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-schedule.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.appointments = data.appointments;
          } else {
            this.showMessage('No schedule found.', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching appointments:', err);
          this.showMessage('Could not load schedule history.', 'error');
        }
      });
  }

  // ✅ Select appointment for editing
  editAppointment(appointment: any): void {
    this.selectedAppointment = { ...appointment }; // make a copy
  }

  // ✅ Save updated appointment
  updateAppointment(): void {
    if (!this.selectedAppointment) return;

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-schedule.php', this.selectedAppointment)
      .subscribe({
        next: (data: any) => {
          if (data.success) {
            this.showMessage('Schedule updated successfully.', 'success');
            this.loadAppointments();
            this.selectedAppointment = null;
          } else {
            this.showMessage('Failed to update schedule.', 'error');
          }
        },
        error: (err) => {
          console.error('Error updating schedule:', err);
          this.showMessage('Error updating schedule.', 'error');
        }
      });
  }

  // ✅ Delete appointment
  deleteAppointment(id: number): void {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    this.http.delete(`https://kilnenterprise.com/presbyterian-hospital/delete-schedule.php?id=${id}`)
      .subscribe({
        next: (data: any) => {
          if (data.success) {
            this.showMessage('Schedule deleted successfully.', 'success');
            this.loadAppointments();
          } else {
            this.showMessage('Failed to delete schedule.', 'error');
          }
        },
        error: (err) => {
          console.error('Error deleting schedule:', err);
          this.showMessage('Error deleting schedule.', 'error');
        }
      });
  }
}
