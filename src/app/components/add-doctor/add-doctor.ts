import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-doctor',
  templateUrl: './add-doctor.html',
  styleUrls: ['./add-doctor.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AddDoctor implements OnInit {
  doctorData = {
    role: 'doctor',
    doctorId: '',
    ghanaCard: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    specialization: '',
    department: '',
    experience: '',
    license: '',
    phone: '',
    email: '',
    address: ''
  };

  isLoggedIn = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Field validation states for asterisk colors
  fieldStates: { [key: string]: boolean } = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    }

    // Initialize field states
    this.initializeFieldStates();
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.isLoggedIn) {
      const apiUrl = this.doctorData.role === 'doctor' 
        ? 'https://kilnenterprise.com/presbyterian-hospital/add-doctor.php' 
        : 'https://kilnenterprise.com/presbyterian-hospital/add-nurse.php'; 

      this.http.post(apiUrl, this.doctorData)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.success) {
              this.successMessage = `${this.doctorData.role.charAt(0).toUpperCase() + this.doctorData.role.slice(1)} added successfully!`;
              this.resetForm();
              setTimeout(() => {
                this.successMessage = '';
                this.router.navigate([`/add-${this.doctorData.role}`]);
              }, 1500);
            } else {
              this.errorMessage = response.message || 'An error occurred while adding the user.';
              setTimeout(() => {
                this.errorMessage = '';
              }, 3000);
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error adding user:', err);
            this.errorMessage = 'There was a problem with the request. Please try again later.';
          }
        });
    } else {
      this.router.navigate(['/login']);
    }
  }

  resetForm() {
    this.doctorData = {
      role: 'doctor',
      doctorId: '',
      ghanaCard: '',
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      specialization: '',
      department: '',
      experience: '',
      license: '',
      phone: '',
      email: '',
      address: ''
    };
    // Reset all field states when form is reset
    this.initializeFieldStates();
  }

  // Initialize field states
  initializeFieldStates() {
    this.fieldStates = {};
  }

  // Check if field is filled (not empty)
  isFieldFilled(fieldName: string): boolean {
    const value = this.doctorData[fieldName as keyof typeof this.doctorData];
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  // Update field state when input changes
  onFieldChange(fieldName: string) {
    this.fieldStates[fieldName] = this.isFieldFilled(fieldName);
  }

  // Get CSS class for asterisk based on field state
  getAsteriskClass(fieldName: string): string {
    if (this.fieldStates[fieldName] === undefined) {
      return 'text-red-500'; // Default to red for empty fields
    }
    return this.fieldStates[fieldName] ? 'text-green-500' : 'text-red-500';
  }
}
