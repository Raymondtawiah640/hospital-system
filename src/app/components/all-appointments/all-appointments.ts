import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';  // Import Router to navigate
import { AuthService } from '../../services/auth';  // Import AuthService
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-appointments',
  templateUrl: './all-appointments.html',
  styleUrls: ['./all-appointments.css'],
  imports: [CommonModule]
})
export class AllAppointments implements OnInit {
  appointments: any[] = [];  // Array to hold the list of appointments
  isLoading: boolean = false;
  errorMessage: string = '';
  isLoggedIn: boolean = false;  // Variable to hold login status

  // Modal related
  showDeleteModal: boolean = false;
  selectedAppointment: any = null;

  // Action loading states
  isMarkingDone: boolean = false;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.checkLoginStatus();  // Check if the user is logged in when the component initializes
    if (this.isLoggedIn) {
      this.loadAppointments();  // Load appointments if logged in
    }
  }

  // Check login status using AuthService
  checkLoginStatus(): void {
    this.isLoggedIn = this.authService.loggedIn();  // Use AuthService to check login status
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login if not logged in
    }
  }

  // Load appointments data from the API
  loadAppointments(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-all-appointments.php')  // Endpoint to get all appointments
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.appointments = data.appointments;  // Store the list of appointments
          } else {
            this.errorMessage = 'Failed to load appointments. Please try again later.';  // Show error
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem fetching appointment data. Please try again later.';  // Show error
        }
      });
  }

  // Delete an appointment by ID
  deleteAppointment(appointment: any): void {
    this.selectedAppointment = appointment;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const appointmentId = this.selectedAppointment.id;
    this.closeModals(); // Close modal immediately
    this.isLoading = true;
    this.http.delete(`https://kilnenterprise.com/presbyterian-hospital/delete-appointment.php?id=${appointmentId}`)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            // Remove the deleted appointment from the local list
            this.appointments = this.appointments.filter(appointment => appointment.id !== appointmentId);
          } else {
            this.errorMessage = response.message || 'Failed to delete appointment. Please try again later.';
            // Re-add the appointment to the list if delete failed
            this.loadAppointments();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem deleting the appointment. Please try again later.';
          // Re-add the appointment to the list if delete failed
          this.loadAppointments();
        }
      });
  }

  closeModals(): void {
    this.showDeleteModal = false;
    this.selectedAppointment = null;
  }

  markAsDone(appointment: any): void {
    this.isMarkingDone = true;
    this.http.put(`https://kilnenterprise.com/presbyterian-hospital/update-appointment.php`, { id: appointment.id })
      .subscribe({
        next: (response: any) => {
          this.isMarkingDone = false;
          if (response.success) {
            // Remove from current list since it's now completed
            this.appointments = this.appointments.filter(a => a.id !== appointment.id);
          } else {
            this.errorMessage = response.message || 'Failed to mark appointment as done.';
          }
        },
        error: (err) => {
          this.isMarkingDone = false;
          this.errorMessage = 'There was a problem updating the appointment.';
        }
      });
  }
}
