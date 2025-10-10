import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

interface LabTest {
  id: number;
  name: string;
  patient: string;
  doctor: string;
  date: Date;
  status: 'Completed' | 'Pending' | 'Cancelled';
  type?: string;
}

interface Doctor {
  id: number;
  doctor_id: string;
  first_name: string;
  last_name: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  ghana_card_number: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  phone_number: string;
  email: string;
  residential_address: string;
  emergency_name: string;
  emergency_phone: string;
}

@Component({
  selector: 'app-laboratory-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './laboratory-tests.html',
  styleUrls: ['./laboratory-tests.css']
})
export class LaboratoryTests implements OnInit {
  patientSearchTerm: string = ''; // Separate search term for patients
  doctorSearchTerm: string = '';  // Separate search term for doctors
  doctors: Doctor[] = []; // Store doctors list
  filteredDoctors: Doctor[] = []; // Store filtered doctors list
  patients: Patient[] = []; // Store patients list
  filteredPatients: Patient[] = []; // Store filtered patients list
  isLoggedIn: boolean = false; // To check if the user is logged in

  newTest: LabTest = {
    id: 0,
    name: '',
    patient: '',
    doctor: '',
    date: new Date(),
    status: 'Pending',
    type: ''
  };
  isLoading: boolean = false; // Loading state for form submission
  successMessage: string = ''; // Store success message
  errorMessage: string = ''; // Store error message

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      this.fetchDoctors(); // Fetch doctors if logged in
      this.fetchPatients(); // Fetch patients if logged in
    }
  }

  // Fetch doctors from the API
  fetchDoctors(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-doctor.php';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (response.success) {
          this.doctors = response.doctors;
          this.filteredDoctors = response.doctors; // Initialize the filtered list
        } else {
          this.errorMessage = response.message;
        }
      },
      (error) => {
        this.errorMessage = '❌ Error fetching doctors.';
      }
    );
  }

  // Fetch patients from the API
  fetchPatients(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-patients.php';
    this.http.get<Patient[]>(apiUrl).subscribe(
      (data) => {
        this.patients = data;
        this.filteredPatients = data; // Initialize the filtered list
      },
      (error) => {
        this.errorMessage = '❌ Error fetching patients.';
      }
    );
  }

  // Filter patients based on the patientSearchTerm
  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(this.patientSearchTerm.toLowerCase())
    );
  }

  // Filter doctors based on the doctorSearchTerm
  filterDoctors(): void {
    this.filteredDoctors = this.doctors.filter(doctor =>
      `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(this.doctorSearchTerm.toLowerCase())
    );
  }

  // Method to add a new test via API
  addLabTest(): void {
    this.isLoading = true; // Set loading to true when starting the submission

    // Ensure newTest.date is a Date object and format it to 'YYYY-MM-DD'
    const formattedDate = new Date(this.newTest.date).toISOString().split('T')[0];

    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/laboratory-tests.php';
    const newTestData = {
      name: this.newTest.name,
      patientId: this.newTest.patient,
      doctor: this.newTest.doctor,
      date: formattedDate,
      status: this.newTest.status,
      type: this.newTest.type
    };

    this.http.post(apiUrl, newTestData).subscribe(
      (response: any) => {
        this.isLoading = false; // Set loading to false after the response
        if (response.success) {
          this.successMessage = response.message; // Display success message
          setTimeout(() => {
            window.location.reload(); // Reload the page after success message
          }, 2000); // Delay before reloading
        } else {
          this.errorMessage = response.message; // Display error message
        }
      },
      (error) => {
        this.isLoading = false; // Set loading to false if error occurs
        this.errorMessage = '❌ Error adding laboratory test.';
      }
    );
  }
}
