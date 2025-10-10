import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import your AuthService
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-records',
  templateUrl: './patient-records.html',
  styleUrls: ['./patient-records.css'],
  imports: [FormsModule, CommonModule]
})
export class PatientRecords implements OnInit {
  patients: any[] = [];  // All patients
  filteredPatients: any[] = [];  // Filtered patients based on search
  searchQuery: string = '';  // The search term
  isSearching: boolean = false;  // Flag for indicating search in progress
  selectedPatient: any = null;  // Selected patient details
  isLoggedIn: boolean = false;  // To check if the user is logged in

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      this.fetchPatients();  // Fetch patients only if logged in
    }
  }

  // Fetch all patient records from the backend
  fetchPatients() {
    this.http.get<any[]>('https://kilnenterprise.com/presbyterian-hospital/get-patients.php').subscribe({
      next: (data) => {
        this.patients = data;
        this.filteredPatients = data;  // Show all patients initially
      },
      error: (err) => {
        console.error('Error fetching patients:', err);
      }
    });
  }

  // Triggered when the search query changes
  onSearch() {
    if (this.searchQuery.trim() === '') {
      this.isSearching = false;
      this.filteredPatients = this.patients;  // Show all patients if search is empty
    } else {
      this.isSearching = true;
      this.filteredPatients = this.patients.filter(patient => {
        return (
          patient.first_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          patient.last_name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });

      if (this.filteredPatients.length === 0) {
        console.log("No patients found for the search query");
      }
    }
  }

  // Display patient details when a patient is clicked
  onPatientClick(patient: any) {
    this.selectedPatient = patient;  // Set the selected patient to display details
  }

  // Close the modal displaying patient details
  closeModal() {
    this.selectedPatient = null;  // Reset the selected patient
  }
}
