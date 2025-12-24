import { Component } from '@angular/core';

import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
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
    this.openDropdown = null; // Also close any open dropdowns
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

  // Handle clicks outside mobile menu to close it
  onOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const navbar = target.closest('nav');
    const mobileMenu = target.closest('.md\\:hidden');

    // If clicking outside navbar or mobile menu, close mobile menu
    if (!navbar && this.menuOpen) {
      this.closeMenu();
    }
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
