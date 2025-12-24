import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.css'
})
export class Loading {
  @Input() isLoading: boolean = false;

  /**
   * Show the loading indicator
   */
  show(): void {
    this.isLoading = true;
  }

  /**
   * Hide the loading indicator
   */
  hide(): void {
    this.isLoading = false;
  }

  /**
   * Toggle the loading state
   */
  toggle(): void {
    this.isLoading = !this.isLoading;
  }

  /**
   * Show loading for a specified duration, then auto-hide
   * @param duration - Duration in milliseconds (default: 5000ms)
   */
  showFor(duration: number = 5000): void {
    this.show();
    setTimeout(() => {
      this.hide();
    }, duration);
  }
}
