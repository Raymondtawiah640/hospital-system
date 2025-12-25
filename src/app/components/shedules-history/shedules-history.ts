import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shedules-history',
  templateUrl: './shedules-history.html',
  styleUrls: ['./shedules-history.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ShedulesHistory implements OnInit, OnDestroy {
  appointments: any[] = [];
  selectedAppointment: any = null;

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isLoggedIn: boolean = false;

  private messageTimer: any; // 🔹 Timer for clearing messages

  // Modal related
  showDeleteModal: boolean = false;
  scheduleToDelete: any = null;

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  // Clear timer when component is destroyed
  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }

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
          this.showMessage('Error updating schedule.', 'error');
        }
      });
  }

  // ✅ Show delete confirmation modal
  confirmDeleteSchedule(schedule: any): void {
    this.scheduleToDelete = schedule;
    this.showDeleteModal = true;
  }

  // ✅ Delete appointment with modal confirmation
  deleteAppointment(): void {
    if (!this.scheduleToDelete) return;

    this.http.delete('https://kilnenterprise.com/presbyterian-hospital/delete-schedule.php', {
      params: { id: this.scheduleToDelete.id }
    }).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.showMessage('Schedule deleted successfully.', 'success');
          this.loadAppointments();
          this.closeModals();
        } else {
          this.showMessage('Failed to delete schedule.', 'error');
          this.closeModals();
        }
      },
      error: (err) => {
        this.showMessage('Error deleting schedule.', 'error');
        this.closeModals();
      }
    });
  }

  // ✅ Close modals
  closeModals(): void {
    this.showDeleteModal = false;
    this.scheduleToDelete = null;
  }

  // ✅ Helper method to get full doctor name
  getDoctorName(appointment: any): string {
    return `${appointment.first_name} ${appointment.last_name}`;
  }

  // ✅ Helper method to get status class
  getStatusClass(appointment: any): string {
    if (appointment.is_attended) return 'text-green-600 font-semibold';
    if (appointment.is_active) return 'text-blue-600 font-semibold';
    return 'text-gray-600 font-semibold';
  }

  // ✅ Helper method to get status text
  getStatusText(appointment: any): string {
    if (appointment.is_attended) return 'Attended';
    if (appointment.is_active) return 'Active';
    return 'Scheduled';
  }
}
