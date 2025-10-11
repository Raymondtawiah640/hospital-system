import { Component, OnInit } from '@angular/core';
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
  editForm = {
    diagnosis: '',
    treatment_plan: '',
    status: 'completed',
    notes: ''
  };

  constructor(private http: HttpClient) {}

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
          console.error('Error loading consultations:', err);
          this.errorMessage = 'Failed to load consultations. Please try again later.';
        }
      });
  }

  extractDoctors() {
    console.log('=== EXTRACTING DOCTORS ===');
    const doctorSet = new Set<string>();
    this.consultations.forEach(consultation => {
      console.log('Processing consultation:', consultation.id, 'Doctor:', consultation.doctor_name);

      if (consultation.doctor_name && consultation.doctor_name !== 'Not assigned' && consultation.doctor_name !== 'null') {
        // Use the same format as in the display template
        const doctorDisplayName = consultation.doctor_specialization
          ? `${consultation.doctor_name} - ${consultation.doctor_specialization}`
          : `${consultation.doctor_name}${consultation.doctor_department ? ' - ' + consultation.doctor_department : ' - General'}`;
        doctorSet.add(doctorDisplayName);
        console.log('Added doctor to dropdown:', doctorDisplayName);
      }
    });
    this.doctors = Array.from(doctorSet).sort();
    console.log('Final doctors list:', this.doctors);
    console.log('========================');
  }

  applyFilters() {
    console.log('=== APPLYING FILTERS ===');
    console.log('Search term:', this.searchTerm);
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Selected status:', this.selectedStatus);
    console.log('Total consultations:', this.consultations.length);

    this.filteredConsultations = this.consultations.filter(consultation => {
      // Text search
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const patientNameMatch = consultation.patient_name?.toLowerCase().includes(searchLower);
        const diagnosisMatch = consultation.diagnosis?.toLowerCase().includes(searchLower);
        const doctorNameMatch = consultation.doctor_name?.toLowerCase().includes(searchLower);
        const notesMatch = consultation.notes?.toLowerCase().includes(searchLower);

        const matchesSearch = patientNameMatch || diagnosisMatch || doctorNameMatch || notesMatch;

        console.log(`Consultation ${consultation.id}:`, {
          patient_name: consultation.patient_name,
          diagnosis: consultation.diagnosis,
          doctor_name: consultation.doctor_name,
          searchLower,
          patientNameMatch,
          diagnosisMatch,
          doctorNameMatch,
          notesMatch,
          matchesSearch
        });

        if (!matchesSearch) return false;
      }

      // Doctor filter
      if (this.selectedDoctor) {
        const doctorMatch = consultation.doctor_name === this.selectedDoctor;
        console.log(`Doctor filter - Looking for: "${this.selectedDoctor}", Found: "${consultation.doctor_name}", Match: ${doctorMatch}`);
        if (!doctorMatch) return false;
      }

      // Status filter
      if (this.selectedStatus) {
        const statusMatch = consultation.status === this.selectedStatus;
        console.log(`Status filter - Looking for: "${this.selectedStatus}", Found: "${consultation.status}", Match: ${statusMatch}`);
        if (!statusMatch) return false;
      }

      return true;
    });

    console.log('Filtered results:', this.filteredConsultations.length);
    console.log('========================');
  }

  clearFilters() {
    console.log('=== CLEARING FILTERS ===');
    this.searchTerm = '';
    this.selectedDoctor = '';
    this.selectedStatus = '';
    this.filteredConsultations = [...this.consultations];
    console.log('Filters cleared, showing:', this.filteredConsultations.length, 'consultations');
    console.log('========================');
  }

  // Debug method to check current filter state
  debugFilters() {
    console.log('=== FILTER DEBUG ===');
    console.log('Available doctors in dropdown:', this.doctors);
    console.log('Current filters:', {
      searchTerm: this.searchTerm,
      selectedDoctor: this.selectedDoctor,
      selectedStatus: this.selectedStatus
    });
    console.log('Sample consultations:');
    this.consultations.slice(0, 3).forEach(c => {
      console.log(`  ID ${c.id}: ${c.patient_name} - ${c.doctor_name} - ${c.status}`);
    });
    console.log('======================');
  }

  // Edit functionality methods
  editConsultation(consultation: any) {
    console.log('=== EDITING CONSULTATION ===');
    console.log('Editing consultation:', consultation.id);

    this.editingConsultation = consultation;
    this.editForm = {
      diagnosis: consultation.diagnosis || '',
      treatment_plan: consultation.treatment_plan || '',
      status: consultation.status || 'completed',
      notes: consultation.notes || ''
    };

    this.showEditModal = true;
    console.log('Edit form initialized:', this.editForm);
    console.log('============================');
  }

  saveConsultationEdit() {
    if (!this.editingConsultation) return;

    console.log('=== SAVING CONSULTATION EDIT ===');
    console.log('Updating consultation:', this.editingConsultation.id);
    console.log('New data:', this.editForm);

    const updateData = {
      consultation_id: this.editingConsultation.id,
      ...this.editForm
    };

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-consultation.php', updateData)
      .subscribe({
        next: (response: any) => {
          console.log('Update response:', response);
          if (response.success) {
            // Update the local consultation data
            const index = this.consultations.findIndex(c => c.id === this.editingConsultation.id);
            if (index !== -1) {
              this.consultations[index] = { ...this.consultations[index], ...this.editForm };
              this.filteredConsultations = [...this.consultations];
            }
            this.closeEditModal();
            alert('Consultation updated successfully!');
          } else {
            alert('Error updating consultation: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Error updating consultation:', err);
          alert('Error updating consultation. Please try again.');
        }
      });
  }

  closeEditModal() {
    console.log('=== CLOSING EDIT MODAL ===');
    this.showEditModal = false;
    this.editingConsultation = null;
    this.editForm = {
      diagnosis: '',
      treatment_plan: '',
      status: 'completed',
      notes: ''
    };
    console.log('Edit modal closed');
    console.log('===========================');
  }

  deleteConsultation(consultation: any) {
    if (confirm(`Are you sure you want to delete consultation #${consultation.id} for ${consultation.patient_name}?`)) {
      console.log('=== DELETING CONSULTATION ===');
      console.log('Deleting consultation:', consultation.id);

      this.http.post('https://kilnenterprise.com/presbyterian-hospital/delete-consultation.php', {
        consultation_id: consultation.id
      }).subscribe({
        next: (response: any) => {
          console.log('Delete response:', response);
          if (response.success) {
            // Remove from local arrays
            this.consultations = this.consultations.filter(c => c.id !== consultation.id);
            this.filteredConsultations = this.filteredConsultations.filter(c => c.id !== consultation.id);
            this.extractDoctors(); // Refresh doctors list
            alert('Consultation deleted successfully!');
          } else {
            alert('Error deleting consultation: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting consultation:', err);
          alert('Error deleting consultation. Please try again.');
        }
      });
    }
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  trackByConsultationId(index: number, consultation: any): number {
    return consultation.id;
  }
}
