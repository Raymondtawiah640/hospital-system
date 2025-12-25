import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import the AuthService
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.html',
  styleUrls: ['./schedules.css'],
  imports: [FormsModule]
})
export class Schedules implements OnInit {
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  searchTerm: string = '';

  scheduleData = {
    doctorId: '',   // ✅ start empty, no 0
    day: '',
    date: '',
    startTime: '',
    endTime: '',
    department: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isLoggedIn: boolean = false;

  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadDoctors();
    }
  }

  // Load doctor data
  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.doctors = data.doctors;
            this.filteredDoctors = [...this.doctors]; // copy to filtered
          } else {
            this.errorMessage = 'Failed to load doctor data.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'There was a problem fetching doctor data.';
        }
      });
  }

  // Filter doctors by search term
  filterDoctors(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredDoctors = this.doctors.filter(doc =>
      (`${doc.first_name} ${doc.last_name}`).toLowerCase().includes(term)
    );
  }

  // Handle form submission
  onSubmit(scheduleForm: any): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    // Form validation is already handled by button disabled state
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-schedule.php', this.scheduleData, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Schedule added successfully!';

          // ✅ Reset form data
          this.scheduleData = {
            doctorId: '',
            day: '',
            date: '',
            startTime: '',
            endTime: '',
            department: ''
          };

          // ✅ Auto clear success message after 3s
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to add schedule.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'There was a problem with the request. Please try again later.';
      }
    });
  }
}
