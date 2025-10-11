import { Component, OnInit, OnDestroy } from '@angular/core';
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
  showDeleteModal: boolean = false;
  selectedInvoice: any = null;
  prescriptions: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

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
      this.fetchInvoices();
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
    this.fetchPrescriptions(invoice.patient_name);
    this.showViewModal = true;
  }

  fetchPrescriptions(patientName: string): void {
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/prescriptions.php?patient_name=${encodeURIComponent(patientName)}`;
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (Array.isArray(response) && response.length > 0 && response[0].prescriptions) {
          this.prescriptions = response[0].prescriptions;
        } else if (response.success && response.prescriptions) {
          this.prescriptions = response.prescriptions;
        } else {
          this.prescriptions = [];
        }
      },
      (error) => {
        this.prescriptions = [];
      }
    );
  }

  deleteInvoice(invoice: any): void {
    this.selectedInvoice = invoice;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/delete-bill.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedInvoice.id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchInvoices();
          this.closeModals();
          this.setSuccessMessage('Invoice deleted successfully');
        } else {
          this.setErrorMessage(response.message);
          this.closeModals();
        }
      },
      (error) => {
        this.setErrorMessage('Error deleting invoice.');
        this.closeModals();
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
    this.showDeleteModal = false;
    this.selectedInvoice = null;
  }
}
