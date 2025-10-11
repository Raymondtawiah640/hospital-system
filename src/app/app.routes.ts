import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { AddDoctor } from './components/add-doctor/add-doctor';
import { AddPatient } from './components/add-patient/add-patient';
import { AllAppointments } from './components/all-appointments/all-appointments';
import { AllDoctors } from './components/all-doctors/all-doctors';  
import { AllPatients } from './components/all-patients/all-patients'; 
import { AnnualReports } from './components/annual-reports/annual-reports';  
import { AppointmentHistory } from './components/appointment-history/appointment-history'; 
import { Billing } from './components/billing/billing'; 
import { BookAppointment } from './components/book-appointment/book-appointment'; 
import { Cardiology } from './components/cardiology/cardiology';
import { DailyReports } from './components/daily-reports/daily-reports';
import { Emergency } from './components/emergency/emergency';
import { GeneralDepartment } from './components/general-department/general-department';
import { Invoices } from './components/invoices/invoices';
import { LaboratoryTests } from './components/laboratory-tests/laboratory-tests';
import { MedicalRecords } from './components/medical-records/medical-records';
import { MonthlyReports } from './components/monthly-reports/monthly-reports';  
import { PatientRecords } from './components/patient-records/patient-records';
import { Pediatrics } from './components/pediatrics/pediatrics';
import { PharmacyStock } from './components/pharmacy-stock/pharmacy-stock';
import { Prescriptions } from './components/prescriptions/prescriptions';
import { Schedules } from './components/schedules/schedules';   
import { TestResults } from './components/test-results/test-results';
import { Login } from './components/login/login';
import { Profile } from './components/profile/profile';
import { ShedulesHistory } from './components/shedules-history/shedules-history';
import { Authenticate } from './components/authenticate/authenticate';   
import { GeneralDepartmentResult } from './components/general-department-result/general-department-result'; 

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // default route
    { path: 'dashboard', component: Dashboard },
    { path: 'add-doctor', component: AddDoctor },
    { path: 'add-patient', component: AddPatient },
    {path: 'all-appointments', component: AllAppointments},
    {path: 'all-doctors', component: AllDoctors},
    {path: 'all-patients', component: AllPatients},
    {path: 'annual-reports', component: AnnualReports},
    {path: 'appointment-history', component: AppointmentHistory},
    {path: 'billing', component: Billing},
    {path: 'book-appointment', component: BookAppointment},
    {path: 'cardiology', component: Cardiology},
    {path: 'daily-reports', component: DailyReports},
    {path: 'emergency', component: Emergency},
    {path: 'general-department', component: GeneralDepartment},
    {path: 'invoices', component: Invoices},
    {path: 'laboratory-tests', component: LaboratoryTests},
    {path: 'medical-records', component: MedicalRecords},
    {path: 'monthly-reports', component: MonthlyReports},
    {path: 'patient-records', component: PatientRecords},
    {path: 'pediatrics', component: Pediatrics},
    {path: 'pharmacy-stock', component: PharmacyStock},
    {path: 'prescriptions', component: Prescriptions},
    {path: 'schedules', component: Schedules},
    {path: 'test-results', component: TestResults},
    {path: 'login', component: Login},
    {path: 'profile', component: Profile},
    {path: 'history', component: ShedulesHistory},
    {path: 'authenticate', component: Authenticate},
    {path: 'result', component: GeneralDepartmentResult},
    { path: '**', redirectTo: '/dashboard' }
];
