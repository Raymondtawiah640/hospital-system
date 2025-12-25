import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
 selector: 'app-annual-reports',
 templateUrl: './annual-reports.html',
 styleUrls: ['./annual-reports.css'],
 standalone: true,
 imports: [CommonModule, FormsModule]
})
export class AnnualReports implements OnInit, OnDestroy {
 isLoggedIn: boolean = false;
 selectedYear: string = new Date().getFullYear().toString();
 reportData: any = {
   totalPatients: 0,
   totalLabTests: 0,
   totalPrescriptions: 0,
   totalBills: 0,
   totalRevenue: 0,
   yearlyTotals: [],
   labTests: [],
   prescriptions: [],
   bills: []
 };
 isLoading: boolean = false;
 errorMessage: string = '';
 successMessage: string = '';
 private messageTimer: any;

 private http = inject(HttpClient);
 private authService = inject(AuthService);
 private router = inject(Router);

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
   const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/annual-report.php?year=${this.selectedYear}`;
   this.http.get<any>(apiUrl).subscribe(
     (response) => {
       this.isLoading = false;
       if (response.success) {
         this.reportData = response.data;
       } else {
         this.setErrorMessage('Error generating annual report.');
       }
     },
     (error) => {
       this.isLoading = false;
       this.setErrorMessage('Error generating annual report.');
     }
   );
 }

 onYearChange(): void {
   this.generateReport();
 }
}
