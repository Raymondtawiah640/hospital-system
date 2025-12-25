import { Component, OnInit, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-general-department-result',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-department-result.html',
  styleUrls: ['./general-department-result.css'],
  standalone: true
})
export class GeneralDepartmentResult implements OnInit {
  consultations: any[] = [];
  filteredConsultations: any[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  // Filter options
  selectedDoctor = '';
  selectedStatus = '';
  doctors: string[] = [];

  // Edit functionality
  editingConsultation: any = null;
  showEditModal = false;
  isEditing = false; // Prevent multiple rapid clicks
  editForm = {
    diagnosis: '',
    treatment_plan: '',
    status: 'completed',
    notes: ''
  };

  // Delete functionality
  deletingConsultation: any = null;
  showDeleteModal = false;

  // Messaging system
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-consultations.php')
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.consultations = response.consultations || [];
            this.filteredConsultations = [...this.consultations];
            this.extractDoctors();
          } else {
            this.errorMessage = response.message || 'Failed to load consultations';
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Failed to load consultations. Please try again later.';
        }
      });
  }

  extractDoctors() {
    const doctorSet = new Set<string>();
    this.consultations.forEach(consultation => {
      if (consultation.doctor_name && consultation.doctor_name !== 'Not assigned' && consultation.doctor_name !== 'null') {
        // Use the same format as in the display template
        const doctorDisplayName = consultation.doctor_specialization
          ? `${consultation.doctor_name} - ${consultation.doctor_specialization}`
          : `${consultation.doctor_name}${consultation.doctor_department ? ' - ' + consultation.doctor_department : ' - General'}`;
        doctorSet.add(doctorDisplayName);
      }
    });
    this.doctors = Array.from(doctorSet).sort();
  }

  applyFilters() {

    this.filteredConsultations = this.consultations.filter(consultation => {
      // Text search
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const patientNameMatch = consultation.patient_name?.toLowerCase().includes(searchLower);
        const diagnosisMatch = consultation.diagnosis?.toLowerCase().includes(searchLower);
        const doctorNameMatch = consultation.doctor_name?.toLowerCase().includes(searchLower);
        const notesMatch = consultation.notes?.toLowerCase().includes(searchLower);

        if (!(patientNameMatch || diagnosisMatch || doctorNameMatch || notesMatch)) {
          return false;
        }
      }

      // Doctor filter
      if (this.selectedDoctor) {
        // Extract just the doctor name from the selected option (format: "Doctor Name - Specialization")
        const selectedDoctorName = this.selectedDoctor.split(' - ')[0].trim();

        // Skip consultations with "Not assigned" or null/undefined doctors
        if (consultation.doctor_name === 'Not assigned' ||
            consultation.doctor_name === 'null' ||
            !consultation.doctor_name) {
          return false;
        }

        // Trim whitespace from consultation doctor name for comparison
        const consultationDoctorName = consultation.doctor_name.trim();

        // Try exact match first, then partial match as fallback
        const doctorMatch = consultationDoctorName === selectedDoctorName ||
                           consultationDoctorName.includes(selectedDoctorName) ||
                           selectedDoctorName.includes(consultationDoctorName);

        if (!doctorMatch) return false;
      }

      // Status filter
      if (this.selectedStatus) {
        if (consultation.status !== this.selectedStatus) return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedDoctor = '';
    this.selectedStatus = '';
    this.filteredConsultations = [...this.consultations];
  }

  // Edit functionality methods
  editConsultation(consultation: any) {
    // Simple immediate approach - no complex timing
    this.editingConsultation = consultation;
    this.editForm.diagnosis = consultation.diagnosis || '';
    this.editForm.treatment_plan = consultation.treatment_plan || '';
    this.editForm.status = consultation.status || 'completed';
    this.editForm.notes = consultation.notes || '';
    this.showEditModal = true;
  }

  saveConsultationEdit() {
    if (!this.editingConsultation) return;

    const updateData = {
      consultation_id: this.editingConsultation.id,
      diagnosis: this.editForm.diagnosis,
      treatment_plan: this.editForm.treatment_plan,
      status: this.editForm.status,
      notes: this.editForm.notes
    };

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-consultation.php', updateData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            // Update the local consultation data
            const index = this.consultations.findIndex(c => c.id === this.editingConsultation.id);
            if (index !== -1) {
              this.consultations[index] = { ...this.consultations[index], ...this.editForm };
              this.filteredConsultations = [...this.consultations];
            }
            this.closeEditModal();
            this.showMessage('Consultation updated successfully!', 'success');
          } else {
            this.showMessage('Error updating consultation: ' + response.message, 'error');
          }
        },
        error: (err) => {
          this.showMessage('Error updating consultation. Please try again.', 'error');
        }
      });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingConsultation = null;
    this.isEditing = false;
    this.editForm = {
      diagnosis: '',
      treatment_plan: '',
      status: 'completed',
      notes: ''
    };
  }

  deleteConsultation(consultation: any) {
    this.deletingConsultation = consultation;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.deletingConsultation) return;

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/delete-consultation.php', {
      consultation_id: this.deletingConsultation.id
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Remove from local arrays
          this.consultations = this.consultations.filter(c => c.id !== this.deletingConsultation.id);
          this.filteredConsultations = this.filteredConsultations.filter(c => c.id !== this.deletingConsultation.id);
          this.extractDoctors(); // Refresh doctors list
          this.showMessage('Consultation deleted successfully!', 'success');
        } else {
          this.showMessage('Error deleting consultation: ' + response.message, 'error');
        }
        this.closeDeleteModal();
      },
      error: (err) => {
        this.showMessage('Error deleting consultation. Please try again.', 'error');
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingConsultation = null;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';
      case 'pending': return 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';
      case 'cancelled': return 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';
      default: return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';
    }
  }

  trackByConsultationId(index: number, consultation: any): number {
    return consultation.id;
  }

  // Proper messaging system
  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
