import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Invoices implements OnInit, OnDestroy {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  isLoggedIn: boolean = false;
  private messageTimer: any;

  // Summary counts
  totalInvoices: number = 0;
  paidInvoices: number = 0;
  pendingInvoices: number = 0;
  overdueInvoices: number = 0;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;

  // Modal related
  showViewModal: boolean = false;
  selectedInvoice: any = null;
  prescriptions: any[] = [];
  doctors: any[] = [];

  // Monthly/Yearly tracking for anti-cheating
  monthlyTotals: { [key: string]: { month: string; year: number; total: number; count: number } } = {};
  yearlyTotals: { [key: string]: { year: number; total: number; count: number } } = {};
  recordsSaved: boolean = false;


  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Load doctor data for name resolution
  loadDoctors(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-doctor.php';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (response.success && response.doctors) {
          this.doctors = response.doctors;
        } else if (Array.isArray(response)) {
          this.doctors = response;
        } else {
          this.doctors = [];
        }
        // Load invoices after doctors are loaded
        this.fetchInvoices();
      },
      (error) => {
        this.doctors = [];
        // Still load invoices even if doctors fail
        this.fetchInvoices();
      }
    );
  }

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
      this.loadDoctors();
    }
  }

  fetchInvoices(page: number = 1): void {
    this.isLoading = true;
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/billing.php?page=${page}&limit=${this.itemsPerPage}`;
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (Array.isArray(response)) {
          this.invoices = response;
          this.currentPage = 1;
          this.totalPages = 1;
        } else if (response.bills && Array.isArray(response.bills)) {
          this.invoices = response.bills;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
        } else {
          this.setErrorMessage(response.message || 'Error fetching invoices.');
          return;
        }
        this.totalInvoices = this.invoices.length;
        this.calculateSummary();
        this.filteredInvoices = this.invoices;
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Error fetching invoices.');
      }
    );
  }

  calculateSummary(): void {
    this.totalInvoices = this.invoices.length;
    this.paidInvoices = this.invoices.filter(b => b.status === 'paid').length;
    this.pendingInvoices = this.invoices.filter(b => b.status === 'pending').length;
    this.overdueInvoices = this.invoices.filter(b => b.status === 'overdue').length;
    this.calculateMonthlyTotals();
    this.calculateYearlyTotals();
  }

  // Calculate totals by month for anti-cheating records
  calculateMonthlyTotals(): void {
    this.monthlyTotals = {};
    this.invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!this.monthlyTotals[monthKey]) {
        this.monthlyTotals[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          total: 0,
          count: 0
        };
      }

      const amount = parseFloat(invoice.amount) || 0;
      this.monthlyTotals[monthKey].total += amount;
      this.monthlyTotals[monthKey].count += 1;
    });
  }

  // Calculate totals by year for anti-cheating records
  calculateYearlyTotals(): void {
    this.yearlyTotals = {};
    this.invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const yearKey = date.getFullYear().toString();

      if (!this.yearlyTotals[yearKey]) {
        this.yearlyTotals[yearKey] = {
          year: date.getFullYear(),
          total: 0,
          count: 0
        };
      }

      const amount = parseFloat(invoice.amount) || 0;
      this.yearlyTotals[yearKey].total += amount;
      this.yearlyTotals[yearKey].count += 1;
    });
  }

  // Save monthly/yearly records to prevent cheating
  saveFinancialRecords(): void {
    if (this.recordsSaved) {
      this.setErrorMessage('Records have already been saved for this period.');
      return;
    }

    const records = {
      monthly: Object.values(this.monthlyTotals),
      yearly: Object.values(this.yearlyTotals),
      savedDate: new Date().toISOString(),
      totalInvoices: this.totalInvoices,
      savedBy: 'system' // In a real app, this would be the logged-in user
    };

    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/save-financial-records.php';
    this.http.post<any>(apiUrl, records).subscribe(
      (response) => {
        if (response.success) {
          this.recordsSaved = true;
          this.setSuccessMessage('Financial records saved successfully. Records are now immutable.');
        } else {
          this.setErrorMessage(response.message || 'Error saving financial records.');
        }
      },
      (error) => {
        this.setErrorMessage('Error saving financial records. Please try again.');
      }
    );
  }

  // Get monthly total for a specific month
  getMonthlyTotal(monthKey: string): number {
    return this.monthlyTotals[monthKey]?.total || 0;
  }

  // Get yearly total for a specific year
  getYearlyTotal(year: number): number {
    return this.yearlyTotals[year.toString()]?.total || 0;
  }


  // Helper method to get monthly totals as array for template
  getMonthlyTotalsArray(): any[] {
    return Object.values(this.monthlyTotals).sort((a, b) => {
      const aDate = new Date(a.year, parseInt(a.month.split('-')[0]) - 1);
      const bDate = new Date(b.year, parseInt(b.month.split('-')[0]) - 1);
      return bDate.getTime() - aDate.getTime(); // Most recent first
    });
  }

  // Helper method to get yearly totals as array for template
  getYearlyTotalsArray(): any[] {
    return Object.values(this.yearlyTotals).sort((a, b) => b.year - a.year); // Most recent first
  }

  filterInvoices(): void {
    if (!this.searchTerm) {
      this.filteredInvoices = this.invoices;
    } else {
      this.filteredInvoices = this.invoices.filter((invoice: any) => {
        const searchStr = `${invoice.invoice_number} ${invoice.patient_name} ${invoice.doctor_name} ${invoice.amount} ${invoice.status}`.toLowerCase();
        return searchStr.includes(this.searchTerm.toLowerCase());
      });
    }
  }

  ngDoCheck(): void {
    this.filterResults();
  }

  filterResults(): void {
    this.filterInvoices();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-600 font-semibold';
      case 'pending': return 'text-yellow-600 font-semibold';
      case 'overdue': return 'text-red-600 font-semibold';
      default: return 'text-gray-600 font-semibold';
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchInvoices(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchInvoices(this.currentPage + 1);
    }
  }

  viewInvoice(invoice: any): void {
    this.selectedInvoice = invoice;
    this.prescriptions = []; // Clear previous prescriptions
    this.fetchPrescriptions(invoice.patient_name);
    this.showViewModal = true;
  }

  fetchPrescriptions(patientName: string): void {
    // Use the same simple approach as pharmacy stock component
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/prescriptions.php?all=true';
    this.http.get<any[]>(apiUrl).subscribe(
      (response) => {
        if (Array.isArray(response)) {
          // Find the patient group that matches the requested patient name
          const patientGroup = response.find((group: any) => {
            return group.patient_name && patientName &&
                   group.patient_name.toLowerCase() === patientName.toLowerCase();
          });

          if (patientGroup && patientGroup.prescriptions) {
            // Resolve doctor names if they're in "Doctor [ID]" format
            if (patientGroup.doctor_name && patientGroup.doctor_name.startsWith('Doctor ')) {
              const doctorId = parseInt(patientGroup.doctor_name.split(' ')[1]);
              const doctor = this.doctors.find(d => d.id == doctorId || d.doctor_id == doctorId);
              if (doctor) {
                patientGroup.doctor_name = doctor.first_name + ' ' + doctor.last_name;
              }
            }

            this.prescriptions = patientGroup.prescriptions;
          } else {
            this.prescriptions = [];
          }
        } else {
          this.prescriptions = [];
        }
      },
      (error) => {
        this.prescriptions = [];
      }
    );
  }


  printInvoice(): void {
    if (this.selectedInvoice) {
      const prescriptionsHtml = this.prescriptions.length > 0
        ? `<h3 style="margin-top: 30px; color: #333;">Prescribed Medications</h3>
           <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
             <thead>
               <tr style="background-color: #f0f0f0;">
                 <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Medication</th>
                 <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dosage</th>
                 <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Instructions</th>
               </tr>
             </thead>
             <tbody>
               ${this.prescriptions.map(p => `
                 <tr>
                   <td style="border: 1px solid #ddd; padding: 8px;">${p.medicine_name || p.name}</td>
                   <td style="border: 1px solid #ddd; padding: 8px;">${p.dosage}</td>
                   <td style="border: 1px solid #ddd; padding: 8px;">${p.instructions}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>`
        : '<p style="margin-top: 30px; color: #666;">No medications prescribed.</p>';

      const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 2px solid #333; background: white;">
          <header style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">Hospital</h1>
            <p style="color: #7f8c8d; margin: 5px 0; font-size: 14px;">Quality Healthcare Services</p>
            <p style="color: #7f8c8d; margin: 0; font-size: 12px;">123 Medical Center Drive, Healthcare City</p>
          </header>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h2 style="color: #2c3e50; margin: 0 0 10px 0;">Invoice Details</h2>
              <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${this.selectedInvoice.invoice_number}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${this.selectedInvoice.date}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${this.getStatusColor(this.selectedInvoice.status)};">${this.selectedInvoice.status.toUpperCase()}</span></p>
            </div>
            <div>
              <h2 style="color: #2c3e50; margin: 0 0 10px 0;">Patient Information</h2>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${this.selectedInvoice.patient_name}</p>
              <p style="margin: 5px 0;"><strong>Doctor:</strong> ${this.selectedInvoice.doctor_name}</p>
            </div>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Payment Summary</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; font-weight: bold;">Total Amount:</span>
              <span style="font-size: 24px; font-weight: bold; color: #e74c3c;">GH₵${this.selectedInvoice.amount}</span>
            </div>
          </div>

          ${prescriptionsHtml}

          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #7f8c8d;">
            <p style="margin: 5px 0;">Thank you for coming!</p>
            <p style="margin: 5px 0; font-size: 12px;">For inquiries, contact us at (555) 123-4567 or info@presbyterianhospital.com</p>
            <p style="margin: 5px 0; font-size: 10px;">This is a computer-generated invoice and does not require a signature.</p>
          </footer>
        </div>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${this.selectedInvoice.invoice_number}</title>
              <style>
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  private getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'overdue': return '#e74c3c';
      default: return '#7f8c8d';
    }
  }

  closeModals(): void {
    this.showViewModal = false;
    this.selectedInvoice = null;
  }
}
