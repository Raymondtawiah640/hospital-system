import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Ensure you have the AuthService

import { FormsModule } from '@angular/forms'; // <-- Import FormsModule

@Component({
  selector: 'app-prescriptions',
  templateUrl: './prescriptions.html',
  styleUrls: ['./prescriptions.css'],
  standalone: true,
  imports: [FormsModule]  // <-- Add FormsModule here
})
export class Prescriptions implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  department: string = '';
  doctorId: string = '';
  patientName: string = '';
  patients: any[] = [];
  allPatients: any[] = [];
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  testResults: any[] = [];
  filteredTestResults: any[] = [];
  searchTerm: string = '';
  selectedTest: any = null;
  prescriptionMode: string = 'test';
  prescriptionData = {
    patientId: '',
    illness: '',
    medicines: [{medicine: '', dosage: '', instructions: ''}]
  };


  // Track prescribing state
  prescribingTests: Set<number> = new Set();
  prescribedTests: Set<number> = new Set();
  existingPrescriptions: any[] = [];

  // Success and error messages
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false; // Loading flag
  private messageTimer: any;

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

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
      this.fetchAllPatients();
      this.fetchExistingPrescriptions();
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

  // Fetch existing prescriptions to check for duplicates
  fetchExistingPrescriptions(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-prescriptions.php';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (response.success) {
          this.existingPrescriptions = response.prescriptions || [];
        } else {
          this.existingPrescriptions = [];
        }
      },
      (error) => {
        // If API fails, set empty array to avoid blocking prescriptions
        this.existingPrescriptions = [];
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
      illness: '',
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
    return !!this.prescriptionData.patientId && !!this.prescriptionData.illness && this.prescriptionData.medicines.every(med => !!med.medicine && !!med.dosage);
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

  // Fetch all patients for direct prescription
  fetchAllPatients(): void {
    this.http.get<any[]>('https://kilnenterprise.com/presbyterian-hospital/get-patients.php')
      .subscribe(
        (data) => {
          if (data && Array.isArray(data)) {
            this.allPatients = data;
          }
        },
        (error) => {
          this.setErrorMessage('Failed to fetch patients.');
        }
      );
  }

  // Function to filter patients by name
  searchPatient() {
    if (this.patientName) {
      this.http.get<any>(`https://kilnenterprise.com/presbyterian-hospital/get-patients.php`)
        .subscribe(
          (response) => {
            let patientsArray = [];

            // Handle different response formats
            if (Array.isArray(response)) {
              patientsArray = response;
            } else if (response && typeof response === 'object') {
              // If it's an object, try to extract patients array
              patientsArray = response.patients || response.data || [];
            }

            // Filter patients locally based on search term
            const filteredPatients = patientsArray.filter((patient: any) =>
              patient && patient.first_name && patient.last_name &&
              `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(this.patientName.toLowerCase())
            );

            this.patients = filteredPatients;

            if (filteredPatients.length === 0) {
              this.setErrorMessage('No patients found with that name.');
            } else {
              this.setSuccessMessage(`Found ${filteredPatients.length} patient(s).`);
            }
          },
          (error) => {
            this.setErrorMessage('Failed to search patients.');
            this.patients = [];
          }
        );
    } else {
      this.setErrorMessage('Please enter a patient name to search.');
      this.patients = [];
    }
  }

  prescribeMedicine() {
    // Check if all required fields are filled
    const hasPatient = this.prescriptionData.patientId;
    const allMedicinesValid = this.prescriptionData.medicines.every(med => med.medicine && med.dosage);

    if (hasPatient && allMedicinesValid) {
      // Check for duplicate prescriptions
      const duplicates = this.checkForDuplicates();
      if (duplicates.length > 0) {
        this.setErrorMessage(`Duplicate prescriptions found: ${duplicates.join(', ')}. Please review existing prescriptions.`);
        return;
      }

      this.isLoading = true;

      // Send prescriptions for each medicine
      let completed = 0;
      const total = this.prescriptionData.medicines.length;

      this.prescriptionData.medicines.forEach(med => {
        const prescription = {
          patientId: parseInt(this.prescriptionData.patientId), // Convert to integer
          illness: this.prescriptionData.illness,
          medicine: med.medicine,
          dosage: med.dosage,
          instructions: med.instructions,
          doctor_name: this.getCurrentDoctorName() // Add doctor name directly
        };

        // Add timestamp to make each prescription unique
        const prescriptionWithTimestamp = {
          ...prescription,
          prescription_date: new Date().toISOString(),
          prescription_id: Date.now() + Math.random() // Unique ID for each prescription
        };

        this.http.post('https://kilnenterprise.com/presbyterian-hospital/prescriptions.php', prescriptionWithTimestamp)
          .subscribe(
            (response: any) => {
              if (response && response.success) {
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
                  this.fetchExistingPrescriptions(); // Refresh existing prescriptions
                }
              } else {
                this.isLoading = false;
                this.setErrorMessage(`Failed to save prescription for ${med.medicine}`);
              }
            },
            (error: any) => {
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

  // Direct prescription method
  prescribeMedicineDirect() {
    // Check if all required fields are filled
    const hasPatient = this.prescriptionData.patientId;
    const allMedicinesValid = this.prescriptionData.medicines.every(med => med.medicine && med.dosage);

    if (hasPatient && allMedicinesValid) {
      // Check for duplicate prescriptions
      const duplicates = this.checkForDuplicates();
      if (duplicates.length > 0) {
        this.setErrorMessage(`Duplicate prescriptions found: ${duplicates.join(', ')}. Please review existing prescriptions.`);
        return;
      }

      this.isLoading = true;

      // Send prescriptions for each medicine
      let completed = 0;
      const total = this.prescriptionData.medicines.length;

      this.prescriptionData.medicines.forEach(med => {
        const prescription = {
          patientId: parseInt(this.prescriptionData.patientId), // Convert to integer
          illness: this.prescriptionData.illness,
          medicine: med.medicine,
          dosage: med.dosage,
          instructions: med.instructions,
          doctor_name: this.getCurrentDoctorName() // Add doctor name directly
        };

        // Add timestamp to make each prescription unique
        const prescriptionWithTimestamp = {
          ...prescription,
          prescription_date: new Date().toISOString(),
          prescription_id: Date.now() + Math.random() // Unique ID for each prescription
        };

        this.http.post('https://kilnenterprise.com/presbyterian-hospital/prescriptions.php', prescriptionWithTimestamp)
          .subscribe(
            (response: any) => {
              if (response && response.success) {
                this.updateMedicineStock(med.medicine);
                completed++;
                if (completed === total) {
                  this.isLoading = false;
                  this.setSuccessMessage('All prescriptions successfully created.');
                  this.cancelDirect(); // Reset form
                  this.fetchExistingPrescriptions(); // Refresh existing prescriptions
                }
              } else {
                this.isLoading = false;
                this.setErrorMessage(`Failed to save prescription for ${med.medicine}`);
              }
            },
            (error) => {
              console.error('Error Response:', error);
              this.isLoading = false;
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

  // Check for duplicate prescriptions - allow same medicine for different illnesses
  checkForDuplicates(): string[] {
    const duplicates: string[] = [];
    const patientPrescriptions = this.existingPrescriptions.filter(p => p.patient_id === this.prescriptionData.patientId);

    this.prescriptionData.medicines.forEach(med => {
      // Check if this medicine is already prescribed for the SAME illness
      const existing = patientPrescriptions.find(p =>
        p.medicine_name === med.medicine && p.illness === this.prescriptionData.illness
      );
      if (existing) {
        duplicates.push(med.medicine);
      }
    });

    return duplicates;
  }

  // Cancel direct prescription form
  cancelDirect(): void {
    this.prescriptionData = {
      patientId: '',
      illness: '',
      medicines: [{medicine: '', dosage: '', instructions: ''}]
    };
    this.patientName = '';
    this.patients = [];
  }

  // Get current doctor name from auth service or localStorage
  getCurrentDoctorName(): string {
    // Try to get from auth service first
    const staff = this.authService.getStaff();
    if (staff) {
      return staff.full_name || 'Unknown Staff';
    }

    // Fallback to localStorage
    const storedStaff = localStorage.getItem('staff');
    if (storedStaff) {
      const staffData = JSON.parse(storedStaff);
      return staffData.full_name || 'Unknown Staff';
    }

    return 'Unknown Staff';
  }


  ngDoCheck(): void {
    this.filterResults();
  }
}
