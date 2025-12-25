import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
 selector: 'app-general-department',
 templateUrl: './general-department.html',
 styleUrls: ['./general-department.css'],
 standalone: true,
 imports: [FormsModule, CommonModule]
})
export class GeneralDepartment implements OnInit {
 // Authentication
 isLoggedIn = false;

 // Patient consultation data
 consultationData = {
   patientId: '',
   patientName: '',
   age: '',
   gender: '',
   phone: '',
   email: '',
   address: '',

   // Consultation details
   selectedDoctorId: '',
   chiefComplaint: '',
   historyOfPresentIllness: '',
   pastMedicalHistory: '',
   currentMedications: '',
   allergies: '',

   // Vital signs
   bloodPressure: '',
   temperature: '',
   pulse: '',
   respiratoryRate: '',
   oxygenSaturation: '',
   weight: '',
   height: '',

   // Physical examination
   generalAppearance: '',
   cardiovascular: '',
   respiratory: '',
   abdominal: '',
   neurological: '',

   // Assessment and plan
   diagnosis: '',
   treatmentPlan: '',
   medications: '',
   followUpInstructions: '',
   referralNeeded: false,
   referralDepartment: '',

   // Consultation metadata
   consultationDate: '',
   consultingDoctor: '',
   urgency: 'routine',
   status: 'completed'
 };

 // API data
 patients: any[] = [];
 medicines: any[] = [];
 doctors: any[] = [];

 // Only symptoms from API
 symptoms: any[] = [];

 // Form data for adding new items
 newSymptom = '';

 // UI state for management sections
 showSymptomManagement = false;
 showPatientSearch = false;

 // Loading states for API calls
 loadingSymptoms = false;
 savingSymptom = false;

 // UI state
 errorMessage = '';
 successMessage = '';
 isLoading = false;
 showVitalsSection = false;
 showExaminationSection = false;
 showTreatmentSection = false;

 // Form sections visibility - Show all sections at once
 showAllSections = true;

 // Field validation states for asterisk colors
 fieldStates: { [key: string]: boolean } = {};

 // Required fields for each section
 requiredFieldsBySection = {
   'patient-info': ['patientId', 'patientName', 'age', 'gender'],
   'consultation': ['chiefComplaint', 'selectedDoctorId'], // Added selectedDoctorId as required
   'vitals': [], // Optional fields in vitals section
   'examination': [], // Optional fields in examination section
   'treatment': ['diagnosis'] // Only diagnosis is required in treatment
 };



 private http = inject(HttpClient);
 private router = inject(Router);
 private authService = inject(AuthService);

 ngOnInit(): void {
   this.isLoggedIn = this.authService.loggedIn();
   this.consultationData.consultationDate = new Date().toISOString().split('T')[0];
   this.consultationData.consultingDoctor = this.getCurrentDoctorName();

   if (!this.isLoggedIn) {
     this.router.navigate(['/login']);
   }

   // Initialize field states
   this.initializeFieldStates();

   // Load data from APIs
   this.loadPatients();
   this.loadMedicines();
   this.loadSymptoms();
   this.loadDoctors();

 }

 getCurrentDoctorName(): string {
   // This would typically come from the auth service or user profile
   return 'Dr. General Physician';
 }

 // Get selected doctor name for display
 getSelectedDoctorName(): string {
   if (!this.consultationData.selectedDoctorId) {
     return '';
   }
   const selectedDoctor = this.doctors.find(doctor => doctor.doctor_id === this.consultationData.selectedDoctorId);
   return selectedDoctor ? `${selectedDoctor.first_name} ${selectedDoctor.last_name} - ${selectedDoctor.specialization || selectedDoctor.department}` : '';
 }

 // Handle doctor selection change
 onDoctorChange() {
   // Doctor selection handled silently
 }

 // Get display value for fields (show "Not specified" for empty fields in print)
 getDisplayValue(fieldName: string): string {
   const value = this.consultationData[fieldName as keyof typeof this.consultationData];
   if (value === null || value === undefined || String(value).trim() === '' || String(value).trim().toLowerCase() === 'none') {
     return 'Not specified';
   }
   return String(value);
 }

 // Get display value for boolean fields
 getBooleanDisplayValue(fieldName: string): string {
   const value = this.consultationData[fieldName as keyof typeof this.consultationData];
   return value ? 'Yes' : 'No';
 }

 // Quick symptom selection
 addSymptom(symptom: string) {
   const current = this.consultationData.chiefComplaint;
   this.consultationData.chiefComplaint = current ? `${current}, ${symptom}` : symptom;
   // Update field state when symptom is added via quick-select
   this.onFieldChange('chiefComplaint');
 }

 // Quick condition selection
 setDiagnosis(condition: string) {
   this.consultationData.diagnosis = condition;
   // Update field state when diagnosis is set via quick-select
   this.onFieldChange('diagnosis');
 }

 // Quick medication addition
 addMedication(medication: string) {
   if (medication && medication.trim()) {
     const current = this.consultationData.medications;
     const newValue = current ? `${current}, ${medication}` : medication;
     this.consultationData.medications = newValue;

     // Update field state when medication is added via quick-select
     this.onFieldChange('medications');
   }
 }

 // Handle medication selection from dropdown
 onMedicationSelect(event: any) {
   const target = event.target as HTMLSelectElement;
   if (target && target.value && target.value.trim()) {
     this.addMedication(target.value);
     target.value = ''; // Reset selection
   }
 }

 // Calculate BMI
 calculateBMI(): number {
   if (this.consultationData.weight && this.consultationData.height) {
     const heightM = parseFloat(this.consultationData.height) / 100;
     const weight = parseFloat(this.consultationData.weight);

     // Validate inputs
     if (heightM > 0 && weight > 0 && heightM < 3 && weight < 1000) {
       const bmi = weight / (heightM * heightM);
       if (bmi > 0 && bmi < 100) { // Reasonable BMI range
         return parseFloat(bmi.toFixed(1));
       }
     }
   }
   return 0;
 }

 // Submit consultation
 submitConsultation() {
   this.errorMessage = '';
   this.successMessage = '';
   this.isLoading = true;

   if (this.isLoggedIn) {
     const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/save-consultation.php';

     // Map frontend field names to backend expected field names
     const backendData = {
       patient_id: parseInt(this.consultationData.patientId), // Convert to integer
       doctor_id: this.consultationData.selectedDoctorId || null, // Selected doctor (now sends doctor_id string directly)
       symptoms: [], // Will be empty for now - can be enhanced later
       conditions: [], // Will be empty for now - can be enhanced later
       diagnosis: this.consultationData.diagnosis && this.consultationData.diagnosis.trim() !== '' && this.consultationData.diagnosis.trim().toLowerCase() !== 'none' ? this.consultationData.diagnosis.trim() : null,
       treatment_plan: this.consultationData.treatmentPlan || 'As needed',
       notes: `Chief Complaint: ${this.consultationData.chiefComplaint}\n\nHistory of Present Illness: ${this.consultationData.historyOfPresentIllness}\n\nPast Medical History: ${this.consultationData.pastMedicalHistory}\n\nCurrent Medications: ${this.consultationData.currentMedications}\n\nAllergies: ${this.consultationData.allergies}${this.consultationData.selectedDoctorId ? '\n\nConsulting Doctor: ' + this.getSelectedDoctorName() : ''}`,
       follow_up_date: null,
       status: this.consultationData.status || 'completed'
     };


     this.http.post(apiUrl, backendData)
       .subscribe({
         next: (response: any) => {
           this.isLoading = false;
           if (response.success) {
             this.successMessage = 'Consultation saved successfully!';
             this.resetForm();
             setTimeout(() => {
               this.successMessage = '';
             }, 3000);
           } else {
             this.errorMessage = response.message || 'An error occurred while saving the consultation.';
             setTimeout(() => {
               this.errorMessage = '';
             }, 5000);
           }
         },
         error: (err) => {
           this.isLoading = false;
           if (err.error && err.error.message) {
             this.errorMessage = err.error.message;
           } else {
             this.errorMessage = 'There was a problem saving the consultation. Please try again later.';
           }
           setTimeout(() => {
             this.errorMessage = '';
           }, 5000);
         }
       });
   } else {
     this.router.navigate(['/login']);
   }
 }

 // Reset form
 resetForm() {
   this.consultationData = {
     patientId: '',
     patientName: '',
     age: '',
     gender: '',
     phone: '',
     email: '',
     address: '',
     selectedDoctorId: '',
     chiefComplaint: '',
     historyOfPresentIllness: '',
     pastMedicalHistory: '',
     currentMedications: '',
     allergies: '',
     bloodPressure: '',
     temperature: '',
     pulse: '',
     respiratoryRate: '',
     oxygenSaturation: '',
     weight: '',
     height: '',
     generalAppearance: '',
     cardiovascular: '',
     respiratory: '',
     abdominal: '',
     neurological: '',
     diagnosis: '',
     treatmentPlan: '',
     medications: '',
     followUpInstructions: '',
     referralNeeded: false,
     referralDepartment: '',
     consultationDate: new Date().toISOString().split('T')[0],
     consultingDoctor: this.getCurrentDoctorName(),
     urgency: 'routine',
     status: 'completed'
   };
   // Reset all field states when form is reset
   this.initializeFieldStates();
 }

 // Print consultation
 printConsultation() {
   // Hide any URLs that might appear in print
   const style = document.createElement('style');
   style.textContent = `
     @media print {
       * { margin: 0 !important; padding: 0 !important; }
       @page { margin: 0.25in; }
       @page { @bottom-left { content: "" !important; } }
       @page { @bottom-center { content: "" !important; } }
       @page { @bottom-right { content: "" !important; } }
       html::after, body::after { content: "" !important; display: none !important; }
       *[class*="url"], *[id*="url"] { display: none !important; }
       footer, .footer { display: none !important; }
       /* Hide any URLs that might appear in print */
       /* Additional print styles can be added here if needed */
     }
   `;
   document.head.appendChild(style);

   // Small delay to ensure styles are applied
   setTimeout(() => {
     window.print();

     // Clean up the added styles after printing
     setTimeout(() => {
       document.head.removeChild(style);
     }, 1000);
   }, 100);
 }

 // Initialize field states
 initializeFieldStates() {
   this.fieldStates = {};
   // Also update states for existing field values
   this.refreshFieldStates();
 }

 // Refresh all field states (useful for debugging)
 refreshFieldStates() {
   const allFields = [
     'patientId', 'patientName', 'age', 'gender', 'phone', 'email', 'address',
     'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
     'currentMedications', 'allergies', 'bloodPressure', 'temperature',
     'pulse', 'respiratoryRate', 'oxygenSaturation', 'weight', 'height',
     'generalAppearance', 'cardiovascular', 'respiratory', 'abdominal',
     'neurological', 'diagnosis', 'treatmentPlan', 'medications',
     'followUpInstructions', 'referralDepartment', 'urgency'
   ];

   allFields.forEach(field => {
     this.onFieldChange(field);
   });
 }

 // Check if field is filled (not empty)
 isFieldFilled(fieldName: string): boolean {
   const value = this.consultationData[fieldName as keyof typeof this.consultationData];
   const stringValue = String(value || '').trim();

   // Special handling for age field - must be a valid number
   if (fieldName === 'age') {
     const ageNum = parseInt(stringValue);
     const isValidAge = value !== null && value !== undefined && stringValue !== '' && !isNaN(ageNum) && ageNum > 0 && ageNum <= 150;
     return isValidAge;
   }

   // Special handling for patientId field - must be numeric
   if (fieldName === 'patientId') {
     const idNum = parseInt(stringValue);
     const isValidId = value !== null && value !== undefined && stringValue !== '' && !isNaN(idNum) && idNum > 0;
     return isValidId;
   }

   // Special handling for gender field - must be valid option
   if (fieldName === 'gender') {
     const validGenders = ['Male', 'Female', 'Other'];
     const isValidGender = value !== null && value !== undefined && stringValue !== '' && validGenders.includes(stringValue);
     return isValidGender;
   }

   const isFilled = value !== null && value !== undefined && stringValue !== '' && stringValue.toLowerCase() !== 'none';

   return isFilled;
 }

 // Update field state when input changes
 onFieldChange(fieldName: string) {
   this.fieldStates[fieldName] = this.isFieldFilled(fieldName);
 }

 // Get CSS class for asterisk based on field state
 getAsteriskClass(fieldName: string): string {
   if (this.fieldStates[fieldName] === undefined) {
     return 'text-red-500'; // Default to red for empty fields
   }
   return this.fieldStates[fieldName] ? 'text-green-500' : 'text-red-500';
 }

 // Check if all required fields in current section are filled
 areRequiredFieldsFilled(section: string): boolean {
   const requiredFields = this.requiredFieldsBySection[section as keyof typeof this.requiredFieldsBySection] || [];
   return requiredFields.every(field => this.isFieldFilled(field));
 }

 // Check if section is valid for navigation
 isSectionValid(section: string): boolean {
   return this.areRequiredFieldsFilled(section);
 }

 // Check if all required fields across all sections are filled
 areAllRequiredFieldsFilled(): boolean {
   const allSections = Object.keys(this.requiredFieldsBySection);
   const result = allSections.every(section => this.areRequiredFieldsFilled(section));

   // Form validation completed silently

   return result;
 }

 // Check if form is valid for saving/printing
 isFormValid(): boolean {
   const formValid = this.areAllRequiredFieldsFilled();
   const patientIdValid = !!this.consultationData.patientId;
   const isLoading = this.isLoading;

   return !isLoading && formValid && patientIdValid;
 }

 // API Integration Methods
 loadPatients() {
   this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-patients.php')
     .subscribe({
       next: (response: any) => {
         // Handle both array response and object response with patients property
         if (Array.isArray(response)) {
           this.patients = response;
         } else if (response && response.patients) {
           this.patients = response.patients;
         } else {
           this.patients = [];
         }
       },
       error: (err) => {
         this.patients = [];
       }
     });
 }

 loadMedicines() {
   this.http.get('https://kilnenterprise.com/presbyterian-hospital/medicines.php')
     .subscribe({
       next: (response: any) => {
         // Handle both array response and object response with medicines property
         if (Array.isArray(response)) {
           this.medicines = response;
         } else if (response && response.medicines) {
           this.medicines = response.medicines;
         } else {
           this.medicines = [];
         }
       },
       error: (err) => {
         this.medicines = [];
       }
     });
 }

 // Load doctors from API
 loadDoctors() {
   this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')
     .subscribe({
       next: (response: any) => {
         // Handle both array response and object response with doctors property
         if (Array.isArray(response)) {
           this.doctors = response;
         } else if (response && response.doctors) {
           this.doctors = response.doctors;
         } else {
           this.doctors = [];
         }
       },
       error: (err) => {
         this.doctors = [];
       }
     });
 }

 // API-based Management for Symptoms and Conditions
 loadSymptoms() {
   this.loadingSymptoms = true;
   this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-symptoms.php')
     .subscribe({
       next: (response: any) => {
         this.loadingSymptoms = false;
         if (response.success) {
           this.symptoms = response.symptoms || [];
         } else {
           console.error('Error loading symptoms:', response.message);
           this.symptoms = [];
         }
       },
       error: (err) => {
         this.loadingSymptoms = false;
         this.symptoms = [];
       }
     });
 }


 // Add new symptom to database
 addCustomSymptom() {
   if (!this.newSymptom.trim()) {
     return;
   }

   this.savingSymptom = true;
   this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-symptom.php', {
     name: this.newSymptom.trim()
   }).subscribe({
     next: (response: any) => {
       this.savingSymptom = false;
       if (response.success) {
         // Reload symptoms to include the new one
         this.loadSymptoms();
         this.newSymptom = '';
       } else {
         alert('Error: ' + response.message);
       }
     },
     error: (err) => {
       this.savingSymptom = false;
       alert('Error adding symptom. Please try again.');
     }
   });
 }


 // Get all symptoms from database
 getAllSymptoms() {
   return this.symptoms.map(s => s.name);
 }


 // Check if symptom is user-added (has ID > 0)
 isUserAddedSymptom(symptom: string): boolean {
   return this.symptoms.some(s => s.name === symptom && s.id > 0);
 }


 // Patient search functionality
 searchPatient(query: string) {
   if (!query.trim()) {
     return [];
   }
   return this.patients.filter(patient =>
     patient.ghana_card_number?.toLowerCase().includes(query.toLowerCase()) ||
     patient.first_name?.toLowerCase().includes(query.toLowerCase()) ||
     patient.last_name?.toLowerCase().includes(query.toLowerCase()) ||
     patient.phone_number?.toLowerCase().includes(query.toLowerCase())
   );
 }

 // Select patient from search results
 selectPatient(patient: any) {
   // Map API fields to frontend fields - use ID as patient_id, Ghana card as display
   const patientId = patient.id ? patient.id.toString() : '';
   const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
   const age = this.calculateAge(patient.date_of_birth) || '';

   // Handle gender with fallback to valid options
   let gender = patient.gender || '';
   if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
     gender = '';
   }

   // Set values
   this.consultationData.patientId = patientId;
   this.consultationData.patientName = patientName;
   this.consultationData.age = age;
   this.consultationData.gender = gender;
   this.consultationData.phone = patient.phone_number || '';
   this.consultationData.email = patient.email || '';
   this.consultationData.address = patient.residential_address || '';

   // Force field validation update
   setTimeout(() => {
     this.onFieldChange('patientId');
     this.onFieldChange('patientName');
     this.onFieldChange('age');
     this.onFieldChange('gender');
     this.onFieldChange('phone');
     this.onFieldChange('email');
     this.onFieldChange('address');
   }, 100);

   this.showPatientSearch = false;
 }

 // Calculate age from date of birth
 calculateAge(dateOfBirth: string): string {
   if (!dateOfBirth) {
     return '';
   }

   const birthDate = new Date(dateOfBirth);
   const today = new Date();
   let age = today.getFullYear() - birthDate.getFullYear();
   const monthDiff = today.getMonth() - birthDate.getMonth();

   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
     age--;
   }

   return age.toString();
 }


}
