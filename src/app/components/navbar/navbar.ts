import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  menuOpen = false;
  openDropdown: string | null = null; // which dropdown is open
  dropdownTimeout: any; // timer to delay closing

  constructor(public auth: AuthService, private router: Router) {}

  // Toggle mobile menu open/close
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  // Close mobile menu
  closeMenu(): void {
    this.menuOpen = false;
  }

  // Open dropdown immediately
  openDropdownMenu(name: string): void {
    clearTimeout(this.dropdownTimeout);
    this.openDropdown = name;
  }

  // Close dropdown with small delay (to allow cursor to move over menu)
  closeDropdownMenu(): void {
    this.dropdownTimeout = setTimeout(() => {
      this.openDropdown = null;
    }, 200); // 200ms delay
  }

  // Toggle dropdown when clicking (optional for desktop)
  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  // Close both mobile menu and dropdowns
  navigateAndClose(): void {
    this.closeMenu();
    this.openDropdown = null;
  }

  // Auth helpers
  get isLoggedIn(): boolean {
    return this.auth.loggedIn();
  }

  getDepartment(): string | null {
  return localStorage.getItem('department');
}

get isAdmin(): boolean {
  return this.getDepartment() === 'Administration';
}

get isPharmacy(): boolean {
  return this.getDepartment() === 'Pharmacy';
}

get isLaboratory(): boolean {
  return this.getDepartment() === 'Laboratory';
}

get isFinance(): boolean {
  return this.getDepartment() === 'Finance';
}

get isEmergency(): boolean {
  return this.getDepartment() === 'Emergency'
}

}
