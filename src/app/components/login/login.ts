import { Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth'; // import your AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Login implements OnInit {
   staff_id: string = '';
   department: string = '';
   password: string = '';
   message: string = '';
   showPassword: boolean = false;
   isLoading: boolean = false; // to handle the loading state
   lockoutTimer: any;
   remainingTime: number = 0;

   // Centralized messages for better maintainability
   readonly messages = {
     // Authentication status messages
     noPasswordSet: '🔓 No password set - You can set a new password',
     passwordRequired: '🔐 Password required - Enter correct password to login',
     passwordCleared: '🔓 Password cleared from database. You can now set a new password.',
     enterNewPassword: '🔓 Enter your new password.',

     // Error messages
     allFieldsRequired: '⚠️ All fields are required',
     passwordRequirementsNotMet: '❌ Password does not meet security requirements. Please ensure it includes all required elements.',
     wrongCredentials: '❌ Wrong credentials. Please contact administrator to verify your login information.',
     tooManyAttempts: '❌ Too many failed attempts. Please contact administrator.',

     // Success messages
     loginSuccessful: '✅ Login successful! Welcome to the system.',

     // Password strength messages
     passwordTooWeak: '❌ Password is too weak',
     passwordWeak: '⚠️ Password strength: Weak',
     passwordGood: '✅ Password strength: Good',
     passwordStrong: '💪 Password strength: Strong'
   };

  // Password validation properties
  passwordValidation = {
    hasMinLength: false,
    hasMaxLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isValid: false
  };

  passwordStrengthMessage: string = '';
  showPasswordValidation: boolean = false;

  // Password-based authentication system
  hasPasswordInDB: boolean = false;

  constructor(private router: Router, private auth: AuthService, private ngZone: NgZone) {}

  ngOnInit(): void {
    // Initialize password status check
    this.checkPasswordStatus();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  startLockout(remainingTime: number): void {
    // Remove timing completely - just show message without countdown
    this.message = this.messages.tooManyAttempts;
  }

  clearLockout(): void {
    // Clear any remaining timing (no longer used)
    this.remainingTime = 0;
  }

  // Password validation methods
  onPasswordInput(): void {
    console.log('Password input changed:', this.password);
    this.showPasswordValidation = this.password.length > 0;
    this.validatePassword();
  }

  validatePassword(): void {
    const password = this.password || '';
    console.log('Validating password:', password);

    // Check each requirement
    this.passwordValidation.hasMinLength = password.length >= 8;
    this.passwordValidation.hasMaxLength = password.length <= 20;
    this.passwordValidation.hasLowercase = /[a-z]/.test(password);
    this.passwordValidation.hasUppercase = /[A-Z]/.test(password);
    this.passwordValidation.hasNumber = /\d/.test(password);
    this.passwordValidation.hasSpecialChar = /[@$!%*?&]/.test(password);

    // Password is valid if all requirements are met
    this.passwordValidation.isValid = this.passwordValidation.hasMinLength &&
                                      this.passwordValidation.hasMaxLength &&
                                      this.passwordValidation.hasLowercase &&
                                      this.passwordValidation.hasUppercase &&
                                      this.passwordValidation.hasNumber &&
                                      this.passwordValidation.hasSpecialChar;

    console.log('Password validation results:', this.passwordValidation);

    // Update strength message
    this.updatePasswordStrengthMessage();
  }

  updatePasswordStrengthMessage(): void {
    if (this.password.length === 0) {
      this.passwordStrengthMessage = '';
      return;
    }

    const validCount = Object.values(this.passwordValidation).filter(val => val === true).length - 1; // -1 to exclude isValid

    if (validCount === 0) {
      this.passwordStrengthMessage = this.messages.passwordTooWeak;
    } else if (validCount <= 2) {
      this.passwordStrengthMessage = this.messages.passwordWeak;
    } else if (validCount <= 4) {
      this.passwordStrengthMessage = this.messages.passwordGood;
    } else if (validCount === 6) {
      this.passwordStrengthMessage = this.messages.passwordStrong;
    }

    // Add specific requirement feedback
    const missing = [];
    if (!this.passwordValidation.hasMinLength) missing.push('min 8 characters');
    if (!this.passwordValidation.hasMaxLength) missing.push('max 20 characters');
    if (!this.passwordValidation.hasLowercase) missing.push('lowercase letter');
    if (!this.passwordValidation.hasUppercase) missing.push('uppercase letter');
    if (!this.passwordValidation.hasNumber) missing.push('number');
    if (!this.passwordValidation.hasSpecialChar) missing.push('special character');

    if (missing.length > 0) {
      this.passwordStrengthMessage += ` (Missing: ${missing.join(', ')})`;
    }
  }

  getValidationClass(requirement: boolean): string {
    return requirement ? 'text-green-600' : 'text-red-600';
  }

  getValidationIcon(requirement: boolean): string {
    return requirement ? '✓' : '✗';
  }


  // Password-based authentication system methods
  checkPasswordStatus(): void {
    // This will be called during login to check if password exists in DB
    this.message = '';
  }


  getAuthStatusColor(): string {
    return this.hasPasswordInDB ? 'text-blue-600' : 'text-green-600';
  }

  getAuthStatusIcon(): string {
    return this.hasPasswordInDB ? '🔐' : '🔓';
  }

  getAuthStatusText(): string {
    return this.hasPasswordInDB ? 'Password Required' : 'Set New Password';
  }

  login(): void {
    // Check required fields
    if (!this.staff_id || !this.department || !this.password) {
      this.message = this.messages.allFieldsRequired;
      return;
    }

    this.isLoading = true;
    this.message = '';

    // Validate password meets requirements
    this.validatePassword();
    if (!this.passwordValidation.isValid) {
      this.message = this.messages.passwordRequirementsNotMet;
      this.isLoading = false;
      return;
    }

    // Call AuthService - it will handle password checking
    this.auth.login(this.staff_id, this.department, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.staff) {
          // Successful login
          this.hasPasswordInDB = true; // Password exists and is correct
          this.message = this.messages.loginSuccessful;
          this.router.navigate(['/dashboard']);
        } else {
          // Login failed - check if it's because no password is set
          if (res.message && (res.message.includes('no password') || res.message.includes('empty'))) {
            // No password in database
            this.hasPasswordInDB = false;
            this.message = this.messages.noPasswordSet;
          } else {
            // Any credential issue - use general message
            this.message = res.message || this.messages.wrongCredentials;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);

        // Check if this is a "no password" scenario
        if (err.status === 404 || (err.error && err.error.message && err.error.message.includes('not found'))) {
          this.hasPasswordInDB = false;
          this.message = this.messages.enterNewPassword;
        } else {
          this.message = this.messages.wrongCredentials;
        }
      }
    });
  }
}
