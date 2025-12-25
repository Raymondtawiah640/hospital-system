import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
 selector: 'app-monthly-reports',
 templateUrl: './monthly-reports.html',
 styleUrls: ['./monthly-reports.css'],
 standalone: true,
 imports: [CommonModule, FormsModule]
})
export class MonthlyReports implements OnInit, OnDestroy {
 isLoggedIn: boolean = false;
 selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM format
 reportData: any = {
   totalPatients: 0,
   totalLabTests: 0,
   totalPrescriptions: 0,
   totalBills: 0,
   totalRevenue: 0,
   monthlyTotals: [],
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
   const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/monthly-report.php?month=${this.selectedMonth}`;
   this.http.get<any>(apiUrl).subscribe(
     (response) => {
       this.isLoading = false;
       if (response.success) {
         this.reportData = response.data;
       } else {
         this.setErrorMessage('Error generating monthly report.');
       }
     },
     (error) => {
       this.isLoading = false;
       this.setErrorMessage('Error generating monthly report.');
     }
   );
 }

 onMonthChange(): void {
   this.generateReport();
 }

 // Helper method to get month name
 getMonthName(monthString: string): string {
   const date = new Date(monthString + '-01');
   return date.toLocaleString('default', { month: 'long', year: 'numeric' });
 }
}
