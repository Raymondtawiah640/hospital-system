import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Loading } from './components/loading/loading';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer, Loading]
})
export class App {
  constructor(public auth: AuthService, private router: Router) {
    this.setupRouteLoading();
  }

  // reactive signal for showing layout
  showLayout = computed(() => this.auth.loggedIn());

  // Loading state management
  isAppLoading: boolean = false;

  /**
   * Setup automatic loading on route changes
   */
  private setupRouteLoading(): void {
    // Show loading immediately when navigation starts (prevents page flashing)
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Show loading for 5 seconds when navigation begins
        this.showLoadingFor(5000);
      }
    });
  }

  /**
   * Show global loading indicator
   */
  showLoading(): void {
    this.isAppLoading = true;
  }

  /**
   * Hide global loading indicator
   */
  hideLoading(): void {
    this.isAppLoading = false;
  }

  /**
   * Show loading for a specified duration
   * @param duration - Duration in milliseconds (default: 5000ms)
   */
  showLoadingFor(duration: number = 5000): void {
    this.showLoading();
    setTimeout(() => {
      this.hideLoading();
    }, duration);
  }

  /**
   * Manual loading trigger for specific actions
   * @param duration - Duration in milliseconds (default: 4000ms)
   */
  triggerLoading(duration: number = 4000): void {
    this.showLoadingFor(duration);
  }
}
