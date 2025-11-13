import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pharmacy-stock',
  templateUrl: './pharmacy-stock.html',
  styleUrls: ['./pharmacy-stock.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PharmacyStock implements OnInit {
  // Prescription management
  prescriptions: any[] = [];
  filteredPrescriptions: any[] = [];
  bills: any[] = [];

  // Medicine management
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  totalMedicines: number = 0;
  inStockCount: number = 0;
  outOfStockCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;
  showForm: boolean = false;
  isEditing: boolean = false;
  currentMedicine: any = {
    id: null,
    name: '',
    price: 0,
    stock_quantity: 0,
    description: ''
  };
  selectedMedicine: any = null;

  // Common properties
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  prescriptionSearchTerm: string = '';
  medicineSearchTerm: string = '';
  isLoggedIn: boolean = false;

  // Modal related
  showViewModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedPrescription: any = null;

  // Doctor data for name resolution
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
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadDoctors();
      // Initial data load - delay to ensure doctors are loaded properly
      setTimeout(() => {
        this.fetchPrescriptionsForPharmacist();
        this.fetchBills();
        this.fetchMedicines();
      }, 3000); // Increased to 3 seconds
    }
  }


  // Load doctor data for name resolution
  loadDoctors(): void {
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

  // Get doctor name by ID
  getDoctorName(doctorId: string): string {
    if (!doctorId) return 'Unknown Doctor';

    const doctor = this.doctors.find(d => d.doctor_id === doctorId || d.id === doctorId);
    if (doctor) {
      return `${doctor.first_name} ${doctor.last_name}`;
    }

    return 'Unknown Doctor';
  }

  // Pharmacist methods
  fetchPrescriptionsForPharmacist(): void {
    this.isLoading = true;
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/prescriptions.php?all=true';

    this.http.get<any[]>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;

        // The API returns grouped prescriptions by patient directly as an array
        if (Array.isArray(response)) {
          this.prescriptions = response.map((group: any) => {
            // Resolve doctor names if they're in "Doctor [ID]" format
            if (group.doctor_name && group.doctor_name.startsWith('Doctor ')) {
              const doctorId = parseInt(group.doctor_name.split(' ')[1]);
              const doctor = this.doctors.find(d => d.id == doctorId || d.doctor_id == doctorId);
              if (doctor) {
                group.doctor_name = doctor.first_name + ' ' + doctor.last_name;
              }
            }
            return group;
          });
        } else {
          this.prescriptions = [];
        }

        this.filteredPrescriptions = this.prescriptions;

        // Refresh data periodically to catch new prescriptions
        setTimeout(() => {
          this.fetchPrescriptionsForPharmacist();
        }, 30000); // Refresh every 30 seconds
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Failed to fetch prescriptions');
        this.prescriptions = [];
        this.filteredPrescriptions = [];
      }
    );
  }

  fetchBills(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/billing.php?page=1&limit=1000';
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        if (Array.isArray(response)) {
          this.bills = response;
        } else if (response.bills && Array.isArray(response.bills)) {
          this.bills = response.bills;
        } else {
          this.bills = [];
        }
      },
      (error) => {
        this.setErrorMessage('Failed to fetch bills');
      }
    );
  }

  getPaymentStatus(patientName: string): string {
    const bill = this.bills.find(b => b.patient_name === patientName);
    return bill ? bill.status : 'Not Billed';
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-600 font-semibold';
      case 'pending': return 'text-yellow-600 font-semibold';
      case 'overdue': return 'text-red-600 font-semibold';
      default: return 'text-gray-600 font-semibold';
    }
  }

  viewPrescription(prescription: any): void {
    this.selectedPrescription = prescription;
    this.showViewModal = true;
  }

  deletePrescription(prescription: any): void {
    this.selectedPrescription = prescription;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/prescriptions.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedPrescription.prescriptions[0].id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchPrescriptionsForPharmacist();
          this.closeModals();
          this.setSuccessMessage('Prescription deleted successfully');
        } else {
          this.setErrorMessage(response.message);
          this.closeModals();
        }
      },
      (error) => {
        this.setErrorMessage('Error deleting prescription');
        this.closeModals();
      }
    );
  }

  closeModals(): void {
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.selectedPrescription = null;
  }

  filterPrescriptions(): void {
    if (!this.prescriptionSearchTerm) {
      this.filteredPrescriptions = this.prescriptions;
    } else {
      this.filteredPrescriptions = this.prescriptions.filter((prescription: any) => {
        const searchStr = `${prescription.patient_name} ${prescription.doctor_name}`.toLowerCase();
        const searchTermLower = this.prescriptionSearchTerm.toLowerCase();

        // Check if search term matches patient name, doctor name, or any medicine in the prescription
        const matchesBasic = searchStr.includes(searchTermLower);
        const matchesMedicines = prescription.prescriptions?.some((med: any) =>
          med.medicine_name?.toLowerCase().includes(searchTermLower)
        );

        return matchesBasic || matchesMedicines;
      });
    }
  }

  ngDoCheck(): void {
    this.filterPrescriptions();
    this.filterMedicines();
  }

  // Clear prescription search
  clearPrescriptionSearch(): void {
    this.prescriptionSearchTerm = '';
  }

  // Clear medicine search
  clearMedicineSearch(): void {
    this.medicineSearchTerm = '';
  }

  // Medicine management methods
  fetchMedicines(page: number = 1): void {
    this.isLoading = true;
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/medicines.php?page=${page}&limit=${this.itemsPerPage}`;

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (Array.isArray(response)) {
          this.medicines = response;
          this.currentPage = 1;
          this.totalPages = 1;
          this.totalMedicines = response.length;
          this.calculateSummary();
          this.filteredMedicines = this.medicines;
        } else if (response.medicines && Array.isArray(response.medicines)) {
          this.medicines = response.medicines;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalMedicines = response.pagination.totalItems;
          this.calculateSummary();
          this.filteredMedicines = this.medicines;
        } else {
          this.errorMessage = response.message || 'Error fetching medicines.';
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = '❌ Error fetching medicines.';
      }
    );
  }

  calculateSummary(): void {
    this.totalMedicines = this.medicines.length;
    this.inStockCount = this.medicines.filter(m => m.stock_quantity > 0).length;
    this.outOfStockCount = this.medicines.filter(m => m.stock_quantity === 0).length;
  }

  filterMedicines(): void {
    if (!this.medicineSearchTerm) {
      this.filteredMedicines = this.medicines;
    } else {
      this.filteredMedicines = this.medicines.filter((medicine: any) => {
        const searchStr = `${medicine.name} ${medicine.description || ''}`.toLowerCase();
        const searchTermLower = this.medicineSearchTerm.toLowerCase();

        // Enhanced search: name, description, and price
        const matchesBasic = searchStr.includes(searchTermLower);
        const matchesPrice = medicine.price?.toString().includes(searchTermLower);

        return matchesBasic || matchesPrice;
      });
    }
  }

  getStatus(quantity: number): string {
    return quantity > 0 ? 'In Stock' : 'Out of Stock';
  }

  getStatusClass(quantity: number): string {
    return quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
  }

  addNewMedicine(): void {
    this.isEditing = false;
    this.currentMedicine = {
      id: null,
      name: '',
      price: 0,
      stock_quantity: 0,
      description: ''
    };
    this.showForm = true;
  }

  viewMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.showViewModal = true;
  }

  editMedicine(medicine: any): void {
    this.isEditing = true;
    this.currentMedicine = { ...medicine };
    this.showForm = true;
  }

  saveMedicine(): void {
    if (this.isEditing) {
      this.updateMedicine();
    } else {
      this.createMedicine();
    }
  }

  createMedicine(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/medicines.php';
    this.http.post<any>(apiUrl, this.currentMedicine).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.showForm = false;
          this.setSuccessMessage('Medicine added successfully');
        } else {
          // Remove error message display
          console.error('Error adding medicine:', response.message);
        }
      },
      (error) => {
        console.error('Error adding medicine:', error);
      }
    );
  }

  updateMedicine(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/update-medicine.php';
    this.http.put<any>(apiUrl, this.currentMedicine).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.showForm = false;
          this.setSuccessMessage('Medicine updated successfully');
        } else {
          this.setErrorMessage(response.message);
        }
      },
      (error) => {
        this.setErrorMessage('Error updating medicine.');
      }
    );
  }

  deleteMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.showDeleteModal = true;
  }

  confirmDeleteMedicine(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/delete-medicine.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedMedicine.id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.closeMedicineModals();
          this.setSuccessMessage('Medicine deleted successfully');
        } else {
          this.setErrorMessage(response.message);
          this.closeMedicineModals();
        }
      },
      (error) => {
        this.setErrorMessage('Error deleting medicine.');
        this.closeMedicineModals();
      }
    );
  }

  cancelForm(): void {
    this.showForm = false;
  }

  closeMedicineModals(): void {
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.selectedMedicine = null;
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredPrescriptions = this.prescriptions;
    this.filteredMedicines = this.medicines;
  }

  // Get search results count
  getPrescriptionResultsCount(): number {
    return this.filteredPrescriptions.length;
  }

  getMedicineResultsCount(): number {
    return this.filteredMedicines.length;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchMedicines(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchMedicines(this.currentPage + 1);
    }
  }
}

