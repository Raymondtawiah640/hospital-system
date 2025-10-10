import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';  // Import the AuthService

@Component({
  selector: 'app-add-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-patient.html',
  styleUrls: ['./add-patient.css']
})
export class AddPatient implements OnInit {
  // Model for form data
  firstName: string = '';
  lastName: string = '';
  ghanaCardNumber: string = '';
  dateOfBirth: string = '';
  gender: string = '';
  bloodGroup: string = '';
  phoneNumber: string = '';
  email: string = '';
  residentialAddr: string = '';
  emergencyName: string = '';
  emergencyPhone: string = '';
  message: string = '';  
  isLoading: boolean = false; 
  isLoggedIn: boolean = false; 

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

        // Check login status when the component is initialized
        ngOnInit(): void {
          this.isLoggedIn = this.authService.loggedIn();
          if (!this.isLoggedIn) {
            this.router.navigate(['/login']);  // Redirect to login page if not logged in
          }
        }

        // Submit the form
        onSubmit(event: Event) {
        event.preventDefault();
        this.isLoading = true; // Start loading
        this.message = '';     // Clear message

        const patientData = {
          first_name: this.firstName,
          last_name: this.lastName,
          ghana_card_number: this.ghanaCardNumber,
          date_of_birth: this.dateOfBirth,
          gender: this.gender,
          blood_group: this.bloodGroup,
          phone_number: this.phoneNumber,
          email: this.email,
          residential_addr: this.residentialAddr,
          emergency_name: this.emergencyName,
          emergency_phone: this.emergencyPhone
        };

        this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-patient.php', patientData).subscribe({
          next: (response: any) => {
            this.isLoading = false; // Stop loading
            if (response.success) {
              this.message = '✅ Patient added successfully';
              setTimeout(() => location.reload(), 1000); // Show message briefly
            } else {
              this.message = '❌ ' + JSON.stringify(response);
              setTimeout(() => {
                this.message = '';
              }, 3000);
            }
          },
          error: () => {
            this.isLoading = false; // Stop loading on error
            // Removed error message display
          }
        });
      }

}
