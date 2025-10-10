import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import AuthService

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.html',
  styleUrls: ['./book-appointment.css'],
  imports: [FormsModule, CommonModule]
})
export class BookAppointment implements OnInit {
  patients: any[] = [];  // Array to hold patients
  filteredPatients: any[] = [];  // Array to hold filtered patients for search
  doctors: any[] = [];   // Array to hold doctors
  filteredDoctors: any[] = []; // Array to hold filtered doctors for search
  scheduleData = {
    patientId: '',
    doctorId: '',
    department: '',
    date: '',
    time: '',
    reason: ''
  };
  isLoading: boolean = false;
  errorMessage: string = '';   // Error message to be shown
  successMessage: string = ''; // Success message to be shown
  patientSearchTerm: string = '';  // Search term for patients
  doctorSearchTerm: string = '';   // Search term for doctors
  isLoggedIn: boolean = false;  // Variable to hold login status

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Check if the user is logged in, and redirect to login page if not
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      this.loadPatients();  // Load patient data only if logged in
      this.loadDoctors();   // Load doctors only if logged in
    }
  }

  // Load patient data from API
  loadPatients(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-patients.php')  // Endpoint to get patients
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          this.patients = data.patients || data;  // Fallback to direct data if not wrapped in 'patients'
          this.filteredPatients = this.patients;  // Initialize filteredPatients with the full list
          this.cdRef.detectChanges();  // Manually trigger change detection if necessary
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem fetching patient data. Please try again later.'; // Show error
          this.autoHideMessage('error');
        }
      });
  }

  // Load doctor data dynamically
  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')  // Endpoint to get doctors
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.doctors = data.doctors;  // Store the list of doctors
            this.filteredDoctors = this.doctors;  // Initialize filteredDoctors with the full list
          } else {
            this.errorMessage = 'Failed to load doctor data. Please try again later.'; // Show error
            this.autoHideMessage('error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem fetching doctor data. Please try again later.'; // Show error
          this.autoHideMessage('error');
        }
      });
  }

  // Filter patients based on search term
  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient =>
      `${patient.first_name} ${patient.last_name} ${patient.ghana_card_number}`
        .toLowerCase()
        .includes(this.patientSearchTerm.toLowerCase())
    );
  }

  // Filter doctors based on search term
  filterDoctors(): void {
    this.filteredDoctors = this.doctors.filter(doctor =>
      `${doctor.first_name} ${doctor.last_name}`
        .toLowerCase()
        .includes(this.doctorSearchTerm.toLowerCase())
    );
  }

  // Handle form submission
  onSubmit(): void {
    console.log('Form submitted with data:', this.scheduleData);
    console.log('Form valid:', this.isFormValid);

    if (this.scheduleData.patientId && this.scheduleData.doctorId && this.scheduleData.department && this.scheduleData.date && this.scheduleData.time && this.scheduleData.reason) {
      this.isLoading = true;

      // Example POST request to book appointment
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/book-appointment.php', this.scheduleData, {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'Appointment booked successfully!';  // Show success message
            this.autoHideMessage('success');
            this.resetForm();  // Reset the form after booking
          } else {
            this.errorMessage = 'Failed to book the appointment. Please try again later.'; // Show error
            this.autoHideMessage('error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem booking your appointment. Please try again later.'; // Show error
          this.autoHideMessage('error');
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields.';  // Show error
      this.autoHideMessage('error');
    }
  }

  // Automatically hide the message after 5 seconds
  autoHideMessage(type: 'error' | 'success'): void {
    setTimeout(() => {
      if (type === 'error') {
        this.errorMessage = '';
      } else if (type === 'success') {
        this.successMessage = '';
      }
    }, 5000);  // 5 seconds delay
  }

  // Reset form after booking
  resetForm(): void {
    this.scheduleData = {
      patientId: '',
      doctorId: '',
      department: '',
      date: '',
      time: '',
      reason: ''
    };
  }

  // Getter to check if form is valid and button should be enabled
  get isFormValid(): boolean {
    return !!(this.scheduleData.patientId &&
              this.scheduleData.doctorId &&
              this.scheduleData.department &&
              this.scheduleData.date &&
              this.scheduleData.time &&
              this.scheduleData.reason);
  }
}
