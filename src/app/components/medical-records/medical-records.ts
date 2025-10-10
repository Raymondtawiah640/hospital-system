import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-medical-records',
  templateUrl: './medical-records.html',
  styleUrls: ['./medical-records.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MedicalRecords implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  medicalRecords: any[] = [];
  filteredRecords: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  private messageTimer: any;

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  // Method to set success message with auto-hide
  private setSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.clearMessageAfterDelay();
  }

  // Method to set error message with auto-hide
  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.clearMessageAfterDelay();
  }

  // Method to clear messages after 5 seconds
  private clearMessageAfterDelay(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  // Clear timer when component is destroyed
  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.fetchMedicalRecords();
    }
  }

  fetchMedicalRecords(): void {
    this.isLoading = true;
    // Fetch test results as medical records
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-test-results.php';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.success) {
          this.medicalRecords = response.testResults || [];
          this.filteredRecords = this.medicalRecords;
        } else {
          this.setErrorMessage('Error fetching medical records.');
        }
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Error fetching medical records.');
      }
    );
  }

  filterRecords(): void {
    let filtered = this.medicalRecords;

    // Text search
    if (this.searchTerm) {
      filtered = filtered.filter((record: any) => {
        const searchStr = `${record.patient_first_name} ${record.patient_last_name} ${record.doctor_first_name} ${record.doctor_last_name} ${record.name}`.toLowerCase();
        return searchStr.includes(this.searchTerm.toLowerCase());
      });
    }

    // Date range filter
    if (this.startDate) {
      filtered = filtered.filter((record: any) => record.date >= this.startDate);
    }
    if (this.endDate) {
      filtered = filtered.filter((record: any) => record.date <= this.endDate);
    }

    this.filteredRecords = filtered;
  }

  ngDoCheck(): void {
    this.filterResults();
  }

  filterResults(): void {
    this.filterRecords();
  }
}
