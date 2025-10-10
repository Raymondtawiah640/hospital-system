import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Import FormsModule to use ngModel
import { AuthService } from '../../services/auth';  // Import your AuthService
import { Router } from '@angular/router';  // Import Router for redirection

@Component({
  selector: 'app-test-results',
  templateUrl: './test-results.html',
  styleUrls: ['./test-results.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Add FormsModule for ngModel
})
export class TestResults implements OnInit {
  testResults: any[] = [];  // Array to hold all test results
  filteredTestResults: any[] = [];  // Array to hold the filtered test results
  isLoading: boolean = false; // Flag to show loading state
  errorMessage: string = ''; // Error message to display
  searchTerm: string = ''; // Search term for filtering results
  isLoggedIn: boolean = false; // To check if the user is logged in

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      this.fetchTestResults();  // Fetch test results only if logged in
    }
  }

  // Fetch test results from the API
  fetchTestResults(): void {
    this.isLoading = true; // Set loading to true when fetching data
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-test-results.php';  // API URL

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false; // Reset loading state when data is fetched
        if (response.success) {
          this.testResults = response.testResults.map((test: any) => {
            // Convert date string to format yyyy-MM-dd
            test.date = this.formatDate(test.date);
            return test;
          });
          this.filteredTestResults = this.testResults;  // Initially, show all test results
        } else {
          this.errorMessage = response.message; // Show error message if API returns failure
        }
      },
      (error) => {
        this.isLoading = false; // Reset loading state if there's an error
        this.errorMessage = '❌ Error fetching test results.'; // Display error message
      }
    );
  }

  // Method to format a date string into yyyy-MM-dd format
  formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2); // Add leading zero if month is less than 10
    const day = ('0' + d.getDate()).slice(-2); // Add leading zero if day is less than 10
    return `${year}-${month}-${day}`;
  }

  // Method to filter test results based on search term
  filterResults(): void {
    if (!this.searchTerm) {
      this.filteredTestResults = this.testResults; // If searchTerm is empty, show all results
    } else {
      this.filteredTestResults = this.testResults.filter((test: any) => {
        const fullName = `${test.patient_first_name} ${test.patient_last_name} ${test.doctor_first_name} ${test.doctor_last_name} ${test.name}`;
        return fullName.toLowerCase().includes(this.searchTerm.toLowerCase()); // Case-insensitive match
      });
    }
  }

  // Watch for changes in the search term and filter results accordingly
  ngDoCheck(): void {
    this.filterResults(); // Re-filter the results whenever the search term changes
  }
}
