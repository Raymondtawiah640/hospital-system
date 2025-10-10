import { Component, OnInit } from '@angular/core';
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
   urgency: 'routine'
 };

 // API data
 patients: any[] = [];
 medicines: any[] = [];

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
   'consultation': ['chiefComplaint'],
   'vitals': [], // Optional fields in vitals section
   'examination': [], // Optional fields in examination section
   'treatment': ['diagnosis'] // Only diagnosis is required in treatment
 };

 constructor(
   private http: HttpClient,
   private router: Router,
   private authService: AuthService
 ) {}

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

   // Debug: Log initial diagnosis field state
   console.log('Initial diagnosis field state:', {
     value: this.consultationData.diagnosis,
     isFilled: this.isFieldFilled('diagnosis'),
     fieldState: this.fieldStates['diagnosis']
   });
 }

 getCurrentDoctorName(): string {
   // This would typically come from the auth service or user profile
   return 'Dr. General Physician';
 }

 // Get display value for fields (show "none" for empty fields)
 getDisplayValue(fieldName: string): string {
   const value = this.consultationData[fieldName as keyof typeof this.consultationData];
   if (value === null || value === undefined || String(value).trim() === '') {
     return 'none';
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
     return parseFloat((weight / (heightM * heightM)).toFixed(1));
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

     this.http.post(apiUrl, this.consultationData)
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
           console.error('Error saving consultation:', err);
           this.errorMessage = 'There was a problem saving the consultation. Please try again later.';
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
     urgency: 'routine'
   };
   // Reset all field states when form is reset
   this.initializeFieldStates();
 }

 // Print consultation
 printConsultation() {
   window.print();
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
   return value !== null && value !== undefined && String(value).trim() !== '';
 }

 // Update field state when input changes
 onFieldChange(fieldName: string) {
   this.fieldStates[fieldName] = this.isFieldFilled(fieldName);

   // Debug logging for diagnosis field
   if (fieldName === 'diagnosis') {
     console.log(`Field ${fieldName} changed. New state:`, {
       fieldValue: this.consultationData[fieldName as keyof typeof this.consultationData],
       isFilled: this.fieldStates[fieldName],
       asteriskClass: this.getAsteriskClass(fieldName)
     });
   }
 }

 // Get CSS class for asterisk based on field state
 getAsteriskClass(fieldName: string): string {
   const isFilled = this.fieldStates[fieldName];
   const fieldValue = this.consultationData[fieldName as keyof typeof this.consultationData];

   // Debug logging for diagnosis field
   if (fieldName === 'diagnosis') {
     console.log(`Diagnosis field - State: ${isFilled}, Value: "${fieldValue}"`);
   }

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
   return allSections.every(section => this.areRequiredFieldsFilled(section));
 }

 // Check if form is valid for saving/printing
 isFormValid(): boolean {
   return this.areAllRequiredFieldsFilled();
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
         console.error('Error loading patients:', err);
         this.patients = [];
       }
     });
 }

 loadMedicines() {
   console.log('Loading medicines from API...');
   this.http.get('https://kilnenterprise.com/presbyterian-hospital/medicines.php')
     .subscribe({
       next: (response: any) => {
         console.log('Raw medicines API response:', response);

         // Handle both array response and object response with medicines property
         if (Array.isArray(response)) {
           this.medicines = response;
         } else if (response && response.medicines) {
           this.medicines = response.medicines;
         } else {
           this.medicines = [];
         }

         console.log('Processed medicines array:', this.medicines);
         console.log('Total medicines loaded:', this.medicines.length);
       },
       error: (err) => {
         console.error('Error loading medicines:', err);
         this.medicines = [];
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
         console.error('Error loading symptoms:', err);
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
         console.error('Error adding symptom:', response.message);
         alert('Error: ' + response.message);
       }
     },
     error: (err) => {
       this.savingSymptom = false;
       console.error('Error adding symptom:', err);
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
   // Map API fields to frontend fields
   this.consultationData.patientId = patient.ghana_card_number || patient.id || '';
   this.consultationData.patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
   this.consultationData.age = this.calculateAge(patient.date_of_birth) || '';
   this.consultationData.gender = patient.gender || '';
   this.consultationData.phone = patient.phone_number || '';
   this.consultationData.email = patient.email || '';
   this.consultationData.address = patient.residential_address || '';

   // Update field states for patient info
   this.onFieldChange('patientId');
   this.onFieldChange('patientName');
   this.onFieldChange('age');
   this.onFieldChange('gender');
   this.onFieldChange('phone');
   this.onFieldChange('email');
   this.onFieldChange('address');

   this.showPatientSearch = false;
 }

 // Calculate age from date of birth
 calculateAge(dateOfBirth: string): string {
   if (!dateOfBirth) return '';

   const birthDate = new Date(dateOfBirth);
   const today = new Date();
   let age = today.getFullYear() - birthDate.getFullYear();
   const monthDiff = today.getMonth() - birthDate.getMonth();

   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
     age--;
   }

   return age.toString();
 }

 // Debug method to check diagnosis field state (can be called from console)
 debugDiagnosisField() {
   console.log('=== DIAGNOSIS FIELD DEBUG ===');
   console.log('Field value:', `"${this.consultationData.diagnosis}"`);
   console.log('Is field filled:', this.isFieldFilled('diagnosis'));
   console.log('Field state:', this.fieldStates['diagnosis']);
   console.log('Asterisk class:', this.getAsteriskClass('diagnosis'));
   console.log('Required fields for treatment:', this.requiredFieldsBySection['treatment']);
   console.log('Treatment section valid:', this.isSectionValid('treatment'));
   console.log('===========================');
   return {
     value: this.consultationData.diagnosis,
     isFilled: this.isFieldFilled('diagnosis'),
     state: this.fieldStates['diagnosis'],
     class: this.getAsteriskClass('diagnosis'),
     sectionValid: this.isSectionValid('treatment')
   };
 }

}
