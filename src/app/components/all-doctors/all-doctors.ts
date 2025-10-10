import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-doctors',
  templateUrl: './all-doctors.html',
  styleUrls: ['./all-doctors.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AllDoctors implements OnInit {
  doctors: any[] = [];
  selectedDoctorSchedules: any[] = [];
  selectedDoctorId: number | null = null;

  isLoading: boolean = false;
  errorMessage: string = '';
  isLoggedIn: boolean = false;

  searchTerm: string = ''; // 🔍 Search input

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadDoctors();
    }
  }

  // ✅ Load all doctors
  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success && Array.isArray(data.doctors)) {
            this.doctors = data.doctors;
          } else {
            //this.errorMessage = 'Failed to load doctor data.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading doctors:', err);
         // this.errorMessage = 'There was a problem fetching doctor data.';
        }
      });
  }

  // ✅ Load schedules for a doctor and check if attendance is done
  loadDoctorSchedules(doctorId: number): void {
    this.isLoading = true;
    this.http.get(`https://kilnenterprise.com/presbyterian-hospital/get-schedule.php?doctorId=${doctorId}`)
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success && Array.isArray(data.schedules)) {
            this.selectedDoctorSchedules = data.schedules.map((schedule: any) => ({
              ...schedule,
              is_attended: schedule.is_attended === 1 // Ensure boolean flag
            }));
          } else {
            this.selectedDoctorSchedules = [];
            //this.errorMessage = 'No schedules available for this doctor.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading schedules:', err);
          //this.errorMessage = 'There was a problem fetching schedules.';
        }
      });
  }

  // ✅ Handle doctor dropdown change
  onDoctorChange(event: any): void {
    const selectedDoctorId = Number(event.target.value);
    this.selectedDoctorId = selectedDoctorId || null;

    if (this.selectedDoctorId) {
      this.loadDoctorSchedules(this.selectedDoctorId);
    } else {
      this.selectedDoctorSchedules = [];
    }
  }

  // ✅ Mark attendance and disable button
  markAttendance(schedule: any): void {
    if (!this.selectedDoctorId) return;

    // Immediately change button to "Attendance Done" without waiting for API
    schedule.is_attended = true;

    const payload = {
      doctor_id: this.selectedDoctorId,
      schedule_id: schedule.id
    };

    // Make API call in background without blocking UI
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/save-attendance.php', payload)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            // Attendance saved successfully - button already shows "Attendance Done"
          } else {
            // If API fails, revert the button state
            schedule.is_attended = false;
            alert('⚠️ ' + res.message);
          }
        },
        error: (err) => {
          // If API fails, revert the button state
          schedule.is_attended = false;
          //console.error('Error marking attendance:', err);
          //alert('❌ Failed to mark attendance. Please try again.');
        }
      });
  }

  // 🔍 Filter doctors by search term
  get filteredDoctors(): any[] {
    const term = this.searchTerm.toLowerCase();
    return this.doctors.filter(doctor =>
      doctor.first_name.toLowerCase().includes(term) ||
      doctor.last_name.toLowerCase().includes(term) ||
      doctor.doctor_id.toLowerCase().includes(term)
    );
  }
}
