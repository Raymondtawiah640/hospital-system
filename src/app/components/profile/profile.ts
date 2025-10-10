import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile {
  openDropdown: boolean = false;

  constructor(public auth: AuthService, private router: Router) {}

  get isLoggedIn(): boolean {
    return this.auth.loggedIn();
  }

  get staffName(): string {
    return this.auth.getStaff()?.full_name || '';
  }

  toggleDropdown(): void {
    this.openDropdown = !this.openDropdown;
  }

  closeMenu(): void {
    this.openDropdown = false;
  }

  navigateAndClose(): void {
    this.closeMenu();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
