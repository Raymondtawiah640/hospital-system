import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Ensure you have the AuthService
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule

@Component({
  selector: 'app-prescriptions',
  templateUrl: './prescriptions.html',
  styleUrls: ['./prescriptions.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // <-- Add FormsModule here
})
export class Prescriptions implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  department: string = '';
  doctorId: string = '';
  patientName: string = '';
  patients: any[] = [];
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  testResults: any[] = [];
  filteredTestResults: any[] = [];
  searchTerm: string = '';
  selectedTest: any = null;
  prescriptionData = {
    patientId: '',
    medicines: [{medicine: '', dosage: '', instructions: ''}]
  };


  // Track prescribing state
  prescribingTests: Set<number> = new Set();
  prescribedTests: Set<number> = new Set();

  // Success and error messages
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false; // Loading flag
  private messageTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService  // <-- Inject AuthService
  ) {}

  // Method to set success message with auto-hide
  private setSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = ''; // Clear error message
    this.clearMessageAfterDelay();
  }

  // Method to set error message with auto-hide
  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = ''; // Clear success message
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
    }, 5000); // 5 seconds
  }

  // Clear timer when component is destroyed
  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }

  ngOnInit() {
    // Check if logged in
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      // Load prescribed tests from localStorage
      const stored = localStorage.getItem('prescribedTests');
      if (stored) {
        this.prescribedTests = new Set(JSON.parse(stored));
      }
      this.fetchMedicines();
      this.fetchTestResults();
    }
  }

  // Fetch the list of medicines (replace with actual API endpoint)
  fetchMedicines() {
    this.http.get<any[]>('https://kilnenterprise.com/presbyterian-hospital/medicines.php')
      .subscribe(
        (data) => {
           if (data && Array.isArray(data) && data.length > 0) {
             this.medicines = data;
             this.filteredMedicines = data;  // Initialize filtered medicines with all medicines
           } else {
             this.setErrorMessage('No medicines found.');
           }
         },
         (error) => {
           this.setErrorMessage('Failed to fetch medicines. Please check the network or API.');
         }
      );
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
           this.setErrorMessage(response.message); // Show error message if API returns failure
         }
       },
       (error) => {
         this.isLoading = false; // Reset loading state if there's an error
         this.setErrorMessage('❌ Error fetching test results.'); // Display error message
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


  // Select a test result to prescribe for
  selectTest(test: any): void {
    this.selectedTest = test;
    this.prescriptionData.patientId = test.patient_id; // Assuming test has patient_id
    this.prescribingTests.add(test.id);
  }

  // Cancel prescription form
  cancel(): void {
    this.selectedTest = null;
    this.prescriptionData = {
      patientId: '',
      medicines: [{medicine: '', dosage: '', instructions: ''}]
    };
  }

  // Add a new medicine entry
  addMedicine(): void {
    this.prescriptionData.medicines.push({medicine: '', dosage: '', instructions: ''});
  }

  // Remove a medicine entry
  removeMedicine(index: number): void {
    if (this.prescriptionData.medicines.length > 1) {
      this.prescriptionData.medicines.splice(index, 1);
    }
  }

  // Check if form is valid
  get isFormValid(): boolean {
    return !!this.prescriptionData.patientId && this.prescriptionData.medicines.every(med => !!med.medicine && !!med.dosage);
  }

  // Function to filter medicines by name (for future use)
  filterMedicines(search: string = '') {
    if (search) {
      this.filteredMedicines = this.medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      this.filteredMedicines = this.medicines; // If no filter, show all medicines
    }
  }

  // Function to deduct medicine quantity
  updateMedicineStock(medicineName: string) {
    const selectedMedicine = this.medicines.find(medicine => medicine.name === medicineName);
    if (selectedMedicine && selectedMedicine.stock_quantity > 0) {
      selectedMedicine.stock_quantity--; // Deduct one unit from the stock
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/update_medicine_stock.php', {
        id: selectedMedicine.id,
        stock_quantity: selectedMedicine.stock_quantity
      }).subscribe(
        (response) => {
          // Success, but don't set message here since multiple
        },
        (error) => {
          this.setErrorMessage('Failed to update medicine stock for ' + medicineName + '.');
        }
      );
    } else {
      this.setErrorMessage('Out of stock for ' + medicineName + '.');
    }
  }

  // Function to filter patients by name
  searchPatient() {
    if (this.patientName) {
      this.http.get<any[]>(`https://kilnenterprise.com/presbyterian-hospital/get-patients.php?name=${this.patientName}`)
        .subscribe(
          (data) => {
            this.patients = data;
            if (data.length === 0) {
              this.setErrorMessage('No patients found with that name.');
            }
          },
          (error) => {
            this.setErrorMessage('Failed to search patients.');
          }
        );
    } else {
      this.setErrorMessage('Please enter a patient name to search.');
    }
  }

  prescribeMedicine() {
    // Check if all required fields are filled
    const hasPatient = this.prescriptionData.patientId;
    const allMedicinesValid = this.prescriptionData.medicines.every(med => med.medicine && med.dosage);

    if (hasPatient && allMedicinesValid) {
      this.isLoading = true;

      // Send prescriptions for each medicine
      let completed = 0;
      const total = this.prescriptionData.medicines.length;

      this.prescriptionData.medicines.forEach(med => {
        const prescription = {
          patientId: this.prescriptionData.patientId,
          medicine: med.medicine,
          dosage: med.dosage,
          instructions: med.instructions
        };

        this.http.post('https://kilnenterprise.com/presbyterian-hospital/prescriptions.php', prescription)
          .subscribe(
            (response) => {
              console.log('Success Response:', response);
              this.updateMedicineStock(med.medicine);
              completed++;
              if (completed === total) {
                this.isLoading = false;
                this.setSuccessMessage('All prescriptions successfully created.');
                this.prescribedTests.add(this.selectedTest.id);
                localStorage.setItem('prescribedTests', JSON.stringify([...this.prescribedTests]));
                this.prescribingTests.delete(this.selectedTest.id);
                this.selectedTest = null;
                this.cancel(); // Reset form
              }
            },
            (error) => {
              console.error('Error Response:', error);
              this.isLoading = false;
              this.prescribingTests.delete(this.selectedTest.id);
              if (error.status && error.message) {
                this.setErrorMessage(`Error for ${med.medicine}: ${error.status} - ${error.message}`);
              } else {
                this.setErrorMessage(`An unknown error occurred for ${med.medicine}.`);
              }
            }
          );
      });
    } else {
      this.setErrorMessage('All fields must be filled out to prescribe medicine.');
    }
  }


  ngDoCheck(): void {
    this.filterResults();
  }
}
