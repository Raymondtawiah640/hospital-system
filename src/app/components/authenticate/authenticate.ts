import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Staff {
  staff_id: string;
  full_name: string;
  department: string;
}

@Component({
  selector: 'app-authenticate',
  imports: [FormsModule, CommonModule],
  templateUrl: './authenticate.html',
  styleUrl: './authenticate.css'
})
export class Authenticate implements OnInit {
  staffList: Staff[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  isAdmin: boolean = false;

  editingStaff: Staff | null = null;
  newDepartment: string = '';

  newStaff: Staff = {
    staff_id: '',
    full_name: '',
    department: ''
  };

  // Modal states
  showResetPasswordModal: boolean = false;
  showDeleteStaffModal: boolean = false;
  showDeleteConfirmationModal: boolean = false;
  selectedStaffForAction: Staff | null = null;

  departments = [
    'Administration',
    'Nursing',
    'Surgery',
    'Pharmacy',
    'Pediatrics',
    'Laboratory',
    'Emergency',
    'Finance'
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const department = localStorage.getItem('department');
    this.isAdmin = department === 'Administration';

    if (!this.authService.loggedIn() || !this.isAdmin) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-staff.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success && Array.isArray(data.staff)) {
            this.staffList = data.staff;
          } else {
            this.errorMessage = 'Failed to load staff data.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading staff:', err);
          this.errorMessage = 'There was a problem fetching staff data.';
        }
      });
  }

  addStaff(): void {
    if (!this.newStaff.staff_id || !this.newStaff.full_name || !this.newStaff.department) {
      alert('⚠️ Please fill in all fields.');
      return;
    }

    this.isLoading = true;
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-staff.php', this.newStaff)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.success) {
            // Add to local list
            this.staffList.push({ ...this.newStaff });
            // Reset form
            this.newStaff = {
              staff_id: '',
              full_name: '',
              department: ''
            };
            alert('✅ Staff member added successfully!');
          } else {
            alert('⚠️ ' + (res.message || 'Failed to add staff member.'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error adding staff:', err);
          alert('❌ Failed to add staff member. Please try again.');
        }
      });
  }

  startEdit(staff: Staff): void {
    this.editingStaff = { ...staff };
    this.newDepartment = staff.department;
  }

  cancelEdit(): void {
    this.editingStaff = null;
    this.newDepartment = '';
  }

  saveChanges(): void {
    if (!this.editingStaff) return;

    const payload = {
      staff_id: this.editingStaff.staff_id,
      department: this.newDepartment
    };

    this.isLoading = true;
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-staff.php', payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.success) {
            // Update local list
            const index = this.staffList.findIndex(s => s.staff_id === this.editingStaff!.staff_id);
            if (index !== -1) {
              this.staffList[index].department = this.newDepartment;
            }
            this.cancelEdit();
            alert('✅ Staff updated successfully!');
          } else {
            alert('⚠️ ' + (res.message || 'Failed to update staff.'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error updating staff:', err);
          alert('❌ Failed to update staff. Please try again.');
        }
      });
  }

  // Modal methods
  openResetPasswordModal(staff: Staff): void {
    this.selectedStaffForAction = staff;
    this.showResetPasswordModal = true;
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal = false;
    this.selectedStaffForAction = null;
  }

  confirmResetPassword(): void {
    if (!this.selectedStaffForAction) return;

    const payload = {
      staff_id: this.selectedStaffForAction.staff_id,
      action: 'reset_password'
    };

    this.isLoading = true;
    this.closeResetPasswordModal();

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-staff.php', payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.success) {
            // Also reset the local login system state for this user
            if (this.selectedStaffForAction) {
              this.resetUserLoginState(this.selectedStaffForAction.staff_id);
            }
            alert('✅ Password reset successfully! All timing restrictions cleared. User can now attempt login with 2 new attempts.');
          } else {
            alert('⚠️ ' + (res.message || 'Failed to reset password.'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error resetting password:', err);
          alert('❌ Failed to reset password. Please try again.');
        }
      });
  }

  // Reset user login state (communicate with login component if needed)
  private resetUserLoginState(staffId: string): void {
    // This could be enhanced to communicate with the login component
    // For now, we'll just reload the staff list
    this.loadStaff();
  }

  openDeleteStaffModal(staff: Staff): void {
    this.selectedStaffForAction = staff;
    this.showDeleteStaffModal = true;
  }

  closeDeleteStaffModal(): void {
    this.showDeleteStaffModal = false;
    this.showDeleteConfirmationModal = false;
    this.selectedStaffForAction = null;
  }

  proceedToDeleteConfirmation(): void {
    this.showDeleteStaffModal = false;
    this.showDeleteConfirmationModal = true;
  }

  confirmDeleteStaff(): void {
    if (!this.selectedStaffForAction) return;

    const payload = {
      staff_id: this.selectedStaffForAction.staff_id,
      action: 'delete_staff'
    };

    this.isLoading = true;
    this.closeDeleteStaffModal();

    this.http.post('https://kilnenterprise.com/presbyterian-hospital/update-staff.php', payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.success) {
            // Remove from local list
            this.staffList = this.staffList.filter(s => s.staff_id !== this.selectedStaffForAction!.staff_id);
            alert('✅ Staff member deleted successfully!');
          } else {
            alert('⚠️ ' + (res.message || 'Failed to delete staff member.'));
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error deleting staff:', err);
          alert('❌ Failed to delete staff member. Please try again.');
        }
      });
  }
}
