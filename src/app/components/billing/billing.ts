import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.html',
  styleUrls: ['./billing.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Billing implements OnInit, OnDestroy {
  bills: any[] = [];
  filteredBills: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  isLoggedIn: boolean = false;
  private messageTimer: any;

  // Summary counts
  totalBills: number = 0;
  paidBills: number = 0;
  pendingBills: number = 0;
  overdueBills: number = 0;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;

  // Form related
  showForm: boolean = false;
  isEditing: boolean = false;
  currentBill: any = {
    id: null,
    invoice_number: '',
    patient_name: '',
    doctor_name: '',
    amount: 0,
    date: '',
    status: 'pending'
  };

  // Modal related
  showViewModal: boolean = false;
  showDeleteModal: boolean = false;
  showPrescriptionModal: boolean = false;
  selectedBill: any = null;
  prescriptions: any[] = [];
  filteredPrescriptions: any[] = [];
  prescriptionSearchTerm: string = '';
  selectedPrescription: any = null;
  doctors: any[] = [];

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
      this.fetchDoctors();
    }
  }

  fetchBills(page: number = 1): void {
    this.isLoading = true;
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/billing.php?page=${page}&limit=${this.itemsPerPage}`;
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (Array.isArray(response)) {
          this.bills = response;
          this.currentPage = 1;
          this.totalPages = 1;
        } else if (response.bills && Array.isArray(response.bills)) {
          this.bills = response.bills;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
        } else {
          this.setErrorMessage(response.message || 'Error fetching bills.');
          return;
        }
        this.totalBills = this.bills.length;
        // Update doctor names if they are fallback
        this.bills.forEach(bill => {
          if (bill.doctor_name.startsWith('Doctor ')) {
            const id = parseInt(bill.doctor_name.split(' ')[1]);
            const doctor = this.doctors.find(d => d.id == id);
            if (doctor) {
              bill.doctor_name = doctor.first_name + ' ' + doctor.last_name;
            }
          }
        });
        this.calculateSummary();
        this.filteredBills = this.bills;
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Error fetching bills.');
      }
    );
  }

  fetchDoctors(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/get-doctor.php';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (response.success) {
          this.doctors = response.doctors;
          this.fetchBills();
          this.fetchPrescriptions();
        } else {
          this.fetchBills();
          this.fetchPrescriptions();
        }
      },
      (error) => {
        this.fetchBills();
        this.fetchPrescriptions();
      }
    );
  }

  fetchPrescriptions(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/prescriptions.php';
    this.http.get<any[]>(apiUrl).subscribe(
      (response) => {
        this.prescriptions = response || [];
        this.filteredPrescriptions = this.prescriptions;
      },
      (error) => {
        this.setErrorMessage('Failed to fetch prescriptions');
      }
    );
  }

  getFilteredPrescriptions(): any[] {
    if (!this.prescriptionSearchTerm) {
      return this.filteredPrescriptions;
    }
    return this.filteredPrescriptions.filter((prescription: any) => {
      const searchStr = `${prescription.patient_name} ${prescription.doctor_name}`.toLowerCase();
      return searchStr.includes(this.prescriptionSearchTerm.toLowerCase());
    });
  }

  hasBill(patientName: string): boolean {
    return this.bills.some(bill => bill.patient_name === patientName);
  }

  calculateSummary(): void {
    this.totalBills = this.bills.length;
    this.paidBills = this.bills.filter(b => b.status === 'paid').length;
    this.pendingBills = this.bills.filter(b => b.status === 'pending').length;
    this.overdueBills = this.bills.filter(b => b.status === 'overdue').length;
  }

  filterBills(): void {
    if (!this.searchTerm) {
      this.filteredBills = this.bills;
    } else {
      this.filteredBills = this.bills.filter((bill: any) => {
        const searchStr = `${bill.invoice_number} ${bill.patient_name} ${bill.doctor_name} ${bill.amount} ${bill.status}`.toLowerCase();
        return searchStr.includes(this.searchTerm.toLowerCase());
      });
    }
  }

  ngDoCheck(): void {
    this.filterResults();
  }

  filterResults(): void {
    this.filterBills();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-600 font-semibold';
      case 'pending': return 'text-yellow-600 font-semibold';
      case 'overdue': return 'text-red-600 font-semibold';
      default: return 'text-gray-600 font-semibold';
    }
  }

  addNewBill(): void {
    this.isEditing = false;
    this.generateUniqueInvoiceNumber().then(invoiceNumber => {
      this.currentBill = {
        id: null,
        invoice_number: invoiceNumber,
        patient_name: '',
        doctor_name: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      this.showForm = true;
    });
  }

  generateUniqueInvoiceNumber(): Promise<string> {
    return new Promise((resolve) => {
      const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/billing.php?page=1&limit=1000';
      this.http.get<any>(apiUrl).subscribe(
        (response) => {
          let nextNumber = 1;
          if (response.bills && Array.isArray(response.bills)) {
            const existingNumbers = response.bills
              .map((bill: any) => {
                const match = bill.invoice_number?.match(/^#(\d+)$/);
                return match ? parseInt(match[1]) : 0;
              })
              .filter((num: number) => num > 0);
            if (existingNumbers.length > 0) {
              nextNumber = Math.max(...existingNumbers) + 1;
            }
          }
          const invoiceNumber = `#${nextNumber.toString().padStart(4, '0')}`;
          resolve(invoiceNumber);
        },
        (error) => {
          const timestamp = Date.now().toString().slice(-4);
          const invoiceNumber = `#${timestamp.padStart(4, '0')}`;
          resolve(invoiceNumber);
        }
      );
    });
  }

  viewBill(bill: any): void {
    this.selectedBill = bill;
    this.showViewModal = true;
  }

  editBill(bill: any): void {
    this.isEditing = true;
    this.currentBill = { ...bill };
    this.showForm = true;
  }

  saveBill(): void {
    if (this.isEditing) {
      this.updateBill();
    } else {
      this.createBill();
    }
  }

  createBill(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/billing.php';
    this.http.post<any>(apiUrl, this.currentBill).subscribe(
      (response) => {
        if (response.success) {
          this.fetchBills();
          this.showForm = false;
          this.setSuccessMessage('Bill created successfully');
        } else {
          this.setErrorMessage(response.message);
        }
      },
      (error) => {
        this.setErrorMessage('Error adding bill.');
      }
    );
  }

  updateBill(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/update-bill.php';
    this.http.put<any>(apiUrl, this.currentBill).subscribe(
      (response) => {
        if (response.success) {
          this.fetchBills();
          this.showForm = false;
          this.setSuccessMessage('Bill updated successfully');
        } else {
          this.setErrorMessage(response.message);
        }
      },
      (error) => {
        this.setErrorMessage('Error updating bill.');
      }
    );
  }

  deleteBill(bill: any): void {
    this.selectedBill = bill;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/delete-bill.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedBill.id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchBills();
          this.closeModals();
          this.setSuccessMessage('Bill deleted successfully');
        } else {
          this.setErrorMessage(response.message);
          this.closeModals();
        }
      },
      (error) => {
        this.setErrorMessage('Error deleting bill.');
        this.closeModals();
      }
    );
  }

  cancelForm(): void {
    this.showForm = false;
  }

  closeModals(): void {
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.showPrescriptionModal = false;
    this.selectedBill = null;
    this.selectedPrescription = null;
  }

  viewPrescriptions(): void {
    this.showPrescriptionModal = true;
  }

  generateBillFromPrescription(prescription: any): void {
    this.selectedPrescription = prescription;
    this.generateUniqueInvoiceNumber().then(invoiceNumber => {
      const billData = {
        invoice_number: invoiceNumber,
        patient_name: prescription.patient_name,
        doctor_name: prescription.doctor_name,
        amount: prescription.total_amount,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      this.createBillFromPrescription(billData);
    });
  }

  createBillFromPrescription(billData: any): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/billing.php';
    this.http.post<any>(apiUrl, billData).subscribe(
      (response) => {
        if (response.success) {
          // Add the new bill to the local array immediately
          const newBill = {
            ...billData,
            id: response.id || Date.now(), // Use response id if available, otherwise temporary id
            status: 'pending'
          };
          this.bills.unshift(newBill); // Add to beginning of array
          this.filteredBills = this.bills; // Update filtered bills
          this.calculateSummary(); // Recalculate summary counts

          // Prescriptions are not deleted, just filtered out since patient now has a bill
          this.prescriptions = this.prescriptions.filter((p: any) => p.patient_id !== this.selectedPrescription.patient_id);
          this.filteredPrescriptions = this.filteredPrescriptions.filter((p: any) => p.patient_id !== this.selectedPrescription.patient_id);
          this.closeModals();
          this.setSuccessMessage('Bill generated successfully from prescription!');
        } else {
          this.setErrorMessage(response.message);
        }
      },
      (error) => {
        this.setErrorMessage('Error generating bill from prescription.');
      }
    );
  }

  deletePrescriptionsForPatient(patientId: number): void {
    const prescriptionsToDelete = this.prescriptions.filter(p => p.patient_id === patientId);
    prescriptionsToDelete.forEach(prescription => {
      prescription.prescriptions.forEach((med: any) => {
        // First, restore the medicine stock
        this.restoreMedicineStock(med.medicine_id);
        // Then delete the prescription
        const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/prescriptions.php';
        this.http.delete<any>(apiUrl, { body: { id: med.id } }).subscribe(
          (response) => {
            if (!response.success) {
              console.error('Failed to delete prescription:', med.id);
            }
          },
          (error) => {
            console.error('Error deleting prescription:', error);
          }
        );
      });
    });
  }

  restoreMedicineStock(medicineId: number): void {
    // First, fetch the current stock
    const fetchUrl = `https://kilnenterprise.com/presbyterian-hospital/medicines.php?id=${medicineId}`;
    this.http.get<any[]>(fetchUrl).subscribe(
      (medicines) => {
        if (medicines && medicines.length > 0) {
          const medicine = medicines[0];
          const newStock = medicine.stock_quantity + 1;
          // Now update the stock
          const updateUrl = 'https://kilnenterprise.com/presbyterian-hospital/update_medicine_stock.php';
          this.http.post(updateUrl, { id: medicineId, stock_quantity: newStock }).subscribe(
            (response) => {
              // Success, stock restored
            },
            (error) => {
              console.error('Error updating medicine stock:', error);
            }
          );
        }
      },
      (error) => {
        console.error('Error fetching medicine:', error);
      }
    );
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchBills(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchBills(this.currentPage + 1);
    }
  }
}
