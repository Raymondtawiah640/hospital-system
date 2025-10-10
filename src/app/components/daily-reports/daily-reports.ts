import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-daily-reports',
  templateUrl: './daily-reports.html',
  styleUrls: ['./daily-reports.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DailyReports implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  selectedDate: string = new Date().toISOString().split('T')[0];
  reportData: any = {
    totalPatients: 0,
    totalLabTests: 0,
    totalPrescriptions: 0,
    totalBills: 0,
    totalRevenue: 0,
    labTests: [],
    prescriptions: [],
    bills: []
  };
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
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
      this.generateReport();
    }
  }

  generateReport(): void {
    this.isLoading = true;
    // Fetch all data (remove date filter to show all)
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/daily-report.php`;
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.success) {
          this.reportData = response.data;
        } else {
          this.setErrorMessage('Error generating report.');
        }
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Error generating report.');
      }
    );
  }

  onDateChange(): void {
    this.generateReport();
  }
}
