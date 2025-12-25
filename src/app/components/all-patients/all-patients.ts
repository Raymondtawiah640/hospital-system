import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import your AuthService
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-patients',
  templateUrl: './all-patients.html',
  styleUrls: ['./all-patients.css'],
  imports: [FormsModule, CommonModule,]
})
export class AllPatients implements OnInit {
  patients: any[] = [];  // Array to hold the patients data
  filteredPatients: any[] = [];  // Filtered patients based on search
  searchQuery: string = '';  // The search term
  isSearching: boolean = false;  // Flag for indicating search in progress
  isLoggedIn: boolean = false;  // To check if the user is logged in
  selectedPatient: any = null;  // Selected patient details

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      this.fetchPatients();  // Fetch patients only if logged in
    }
  }

  // Fetch all patient records from the backend using the PHP script
  fetchPatients() {
    this.http.get<any>('https://kilnenterprise.com/presbyterian-hospital/get-patients.php').subscribe({
      next: (response) => {
        // Handle both array response and object response with patients property
        if (Array.isArray(response)) {
          this.patients = response;
        } else if (response && response.patients) {
          this.patients = response.patients;
        } else if (response && response.success && response.data) {
          this.patients = response.data;
        } else {
          this.patients = [];
          console.error('Unexpected API response format:', response);
        }

        this.filteredPatients = [...this.patients];  // Show all patients initially
      },
      error: (err) => {
        console.error('Error fetching patients:', err);
        this.patients = [];
        this.filteredPatients = [];
      }
    });
  }

  // Triggered when the search query changes
  onSearch() {
    // Ensure patients array exists
    if (!Array.isArray(this.patients)) {
      this.filteredPatients = [];
      return;
    }

    if (this.searchQuery.trim() === '') {
      this.isSearching = false;
      this.filteredPatients = [...this.patients];  // Show all patients if search is empty
    } else {
      this.isSearching = true;
      this.filteredPatients = this.patients.filter(patient => {
        if (!patient) return false;

        return (
          (patient.first_name && patient.first_name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (patient.last_name && patient.last_name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (patient.ghana_card_number && patient.ghana_card_number.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (patient.phone_number && patient.phone_number.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });
    }
  }

  // Display patient details when a patient is clicked
  onPatientClick(patient: any) {
    if (patient) {
      this.selectedPatient = patient;
    }
  }

  // Close the modal displaying patient details
  closeModal() {
    this.selectedPatient = null;  // Reset the selected patient
  }

  // Calculate age from date of birth
  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Format registration date
  formatRegistrationDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Check if patients are loaded
  hasPatients(): boolean {
    return Array.isArray(this.patients) && this.patients.length > 0;
  }

  // Get patients count
  getPatientsCount(): number {
    return Array.isArray(this.patients) ? this.patients.length : 0;
  }
}

