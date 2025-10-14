import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';  // Import Router to navigate
import { AuthService } from '../../services/auth';  // Import AuthService
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-appointments',
  templateUrl: './all-appointments.html',
  styleUrls: ['./all-appointments.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AllAppointments implements OnInit {
   appointments: any[] = [];  // Array to hold the list of appointments
   filteredAppointments: any[] = [];  // Array to hold filtered appointments for search
   isLoading: boolean = false;
   errorMessage: string = '';
   isLoggedIn: boolean = false;  // Variable to hold login status
   searchTerm: string = '';


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
            this.filteredAppointments = [...this.appointments];  // Initialize filtered list
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


  // Check if appointment date has been reached
  canMarkAsDone(appointment: any): boolean {
    if (!appointment.date) return false;
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return appointmentDate <= today;
  }

  // Get button class based on appointment status
  getButtonClass(appointment: any): string {
    if (this.isMarkingDone) return 'bg-gray-400 cursor-not-allowed';
    return this.canMarkAsDone(appointment)
      ? 'bg-green-500 hover:bg-green-700'
      : 'bg-gray-300 cursor-not-allowed';
  }

  markAsDone(appointment: any): void {
    // Only allow marking as done if date has been reached
    if (!this.canMarkAsDone(appointment)) {
      this.errorMessage = 'Cannot mark appointment as done before the scheduled date.';
      return;
    }

    this.isMarkingDone = true;
    this.http.put(`https://kilnenterprise.com/presbyterian-hospital/update-appointment.php`, { id: appointment.id })
      .subscribe({
        next: (response: any) => {
          this.isMarkingDone = false;
          if (response.success) {
            // Remove from current list since it's now completed
            this.appointments = this.appointments.filter(a => a.id !== appointment.id);
            this.filteredAppointments = this.filteredAppointments.filter(a => a.id !== appointment.id);
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

  // Filter appointments based on search term
  filterAppointments(): void {
    if (!this.searchTerm) {
      this.filteredAppointments = this.appointments;
    } else {
      this.filteredAppointments = this.appointments.filter(appointment =>
        `${appointment.patient_name} ${appointment.patient_lastname} ${appointment.doctor_name} ${appointment.doctor_lastname} ${appointment.department} ${appointment.date} ${appointment.reason}`
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Listen for search input changes
  onSearchChange(): void {
    this.filterAppointments();
  }
}
