import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile {
  openDropdown: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  get isLoggedIn(): boolean {
    return this.authService.loggedIn();
  }

  get staffName(): string {
    return this.authService.getStaff()?.full_name || '';
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
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
