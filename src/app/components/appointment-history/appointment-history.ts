import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointment-history',
  templateUrl: './appointment-history.html',
  styleUrls: ['./appointment-history.css'],
  imports: [CommonModule, FormsModule]
})
export class AppointmentHistory implements OnInit {
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  isLoggedIn: boolean = false;
  searchTerm: string = '';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadAppointmentHistory();
    }
  }

  loadAppointmentHistory(): void {
    this.isLoading = true;
    // Assuming there's an API for appointment history, or use the same as all-appointments
    // For now, using the same endpoint but could filter on backend
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-all-appointments.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            // Filter for past appointments (assuming date is in YYYY-MM-DD format)
            const today = new Date().toISOString().split('T')[0];
            this.appointments = data.appointments.filter((appointment: any) => appointment.date < today);
            this.filteredAppointments = this.appointments; // Initialize filtered list
          } else {
            this.errorMessage = 'Failed to load appointment history. Please try again later.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem fetching appointment history. Please try again later.';
        }
      });
  }

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

  ngDoCheck(): void {
    this.filterAppointments();
  }
}
