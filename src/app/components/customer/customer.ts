import { Component, OnInit, OnDestroy } from '@angular/core';


// Loading service to prevent loading indicators during testimonial transitions
class LoadingService {
  private isLoading = false;

  show(): void {
    this.isLoading = true;
  }

  hide(): void {
    this.isLoading = false;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Prevents loading indicators from showing during testimonial transitions
   * This ensures smooth testimonial rotation without loading interruptions
   */
  preventLoadingDuringTransition(): void {
    this.hide();
  }
}

interface Testimonial {
  text: string;
  author: string;
  position: string;
  location?: string;
}

@Component({
  selector: 'app-customer',
  imports: [],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class Customer implements OnInit, OnDestroy {
  currentIndex = 0;
  private testimonials: HTMLElement[] = [];
  private intervalId?: number;
  private loadingService = new LoadingService();

  // Dynamic testimonial data - easily configurable
  testimonialsData: Testimonial[] = [
    {
      text: "Our hospital's digital transformation began with Medinous. Its intuitive interface, flexible modules, and real-time reporting have allowed us to modernize without disrupting care.",
      author: "Sarah Johnson",
      position: "IT Director",
      location: "Leading Corporate Hospital in Ghana"
    },
    {
      text: "Medinous has revolutionized our patient care workflow. The system's comprehensive features and user-friendly design have significantly improved our operational efficiency and patient satisfaction.",
      author: "Dr. Michael Chen",
      position: "Chief Medical Officer",
      location: "Regional Healthcare Center"
    },
    {
      text: "The implementation of Medinous was seamless and the results were immediate. Our staff adapted quickly, and we've seen remarkable improvements in appointment scheduling and medical record management.",
      author: "Emily Rodriguez",
      position: "Hospital Administrator",
      location: "Private Medical Facility"
    },
    {
      text: "Medinous stands out for its reliability and comprehensive feature set. It has become an integral part of our daily operations, helping us provide better care to our patients.",
      author: "David Thompson",
      position: "Head of IT",
      location: "Multi-Specialty Hospital Chain"
    }
  ];

  // Method to add new testimonials dynamically
  addTestimonial(testimonial: Testimonial): void {
    this.testimonialsData.push(testimonial);
  }

  // Method to update existing testimonial
  updateTestimonial(index: number, testimonial: Testimonial): void {
    if (index >= 0 && index < this.testimonialsData.length) {
      this.testimonialsData[index] = testimonial;
    }
  }

  // Method to remove testimonial
  removeTestimonial(index: number): void {
    if (index >= 0 && index < this.testimonialsData.length) {
      this.testimonialsData.splice(index, 1);
    }
  }

  // Method to prevent loading during testimonial operations
  preventLoading(): void {
    this.loadingService.preventLoadingDuringTransition();
  }

  // Getter for loading service (for external access if needed)
  getLoadingService(): LoadingService {
    return this.loadingService;
  }

  // Method to check if device is mobile
  isMobileDevice(): boolean {
    return window.innerWidth <= 768;
  }

  // Method to get responsive settings based on screen size
  getResponsiveSettings() {
    const width = window.innerWidth;
    if (width <= 480) {
      return {
        autoRotateTime: 5000, // Faster on small mobile
        animationDuration: 400,
        fontScale: 'xs',
        containerPadding: 'p-4',
        iconSize: 'w-12 h-12'
      };
    } else if (width <= 640) {
      return {
        autoRotateTime: 6000, // Faster on mobile
        animationDuration: 400,
        fontScale: 'sm',
        containerPadding: 'p-6',
        iconSize: 'w-12 h-12 sm:w-14 sm:h-14'
      };
    } else if (width <= 768) {
      return {
        autoRotateTime: 7000, // Medium speed on tablet
        animationDuration: 500,
        fontScale: 'md',
        containerPadding: 'p-8',
        iconSize: 'w-14 h-14 sm:w-16 sm:h-16'
      };
    } else if (width <= 1024) {
      return {
        autoRotateTime: 7500, // Slightly faster on small desktop
        animationDuration: 550,
        fontScale: 'lg',
        containerPadding: 'p-10',
        iconSize: 'w-16 h-16 md:w-18 md:h-18'
      };
    } else {
      return {
        autoRotateTime: 8000, // Slower on large desktop
        animationDuration: 600,
        fontScale: 'xl',
        containerPadding: 'p-12',
        iconSize: 'w-16 h-16 lg:w-18 lg:h-18'
      };
    }
  }

  ngOnInit(): void {
    this.initializeTestimonials();
    this.setupResponsiveHandling();
  }

  // Setup responsive handling for window resize
  private setupResponsiveHandling(): void {
    // Handle window resize events
    window.addEventListener('resize', () => {
      const settings = this.getResponsiveSettings();

      // Restart auto-rotation with new timing if interval exists
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.startAutoRotation();
      }
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Small delay to allow orientation to settle
      setTimeout(() => {
        const settings = this.getResponsiveSettings();

        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.startAutoRotation();
        }
      }, 100);
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private initializeTestimonials(): void {
    // Wait for view to be initialized
    setTimeout(() => {
      const testimonialElements = document.querySelectorAll('.testimonial-item');

      this.testimonials = Array.from(testimonialElements) as HTMLElement[];

      if (this.testimonials.length > 0) {
        // Prevent loading during initial setup
        this.loadingService.preventLoadingDuringTransition();

        // Show first testimonial immediately with proper visibility
        this.testimonials[0].classList.add('active');
        this.testimonials[0].style.display = 'block';
        this.testimonials[0].style.visibility = 'visible';

        this.currentIndex = 0;

        // Set up automatic rotation with proper timing
        this.startAutoRotation();

        // Ensure all testimonials are properly initialized
        this.testimonials.forEach((testimonial, index) => {
          testimonial.style.display = index === 0 ? 'block' : 'none';
          testimonial.style.visibility = 'visible';
        });
      }
    }, 50);
  }

  private showTestimonial(index: number): void {
    // Don't do anything if already showing this testimonial
    if (index === this.currentIndex || !this.testimonials[index]) return;

    // Prevent loading indicator during testimonial transition
    this.loadingService.preventLoadingDuringTransition();

    // Hide current testimonial
    if (this.testimonials[this.currentIndex]) {
      this.testimonials[this.currentIndex].classList.remove('active');
      this.testimonials[this.currentIndex].style.display = 'none';
    }

    // Show new testimonial
    if (this.testimonials[index]) {
      this.testimonials[index].classList.add('active');
      this.testimonials[index].style.display = 'block';
      this.testimonials[index].style.visibility = 'visible';
    }

    this.currentIndex = index;
  }

  private startAutoRotation(): void {
    const settings = this.getResponsiveSettings();
    this.intervalId = window.setInterval(() => {
      const nextIndex = (this.currentIndex + 1) % this.testimonials.length;
      this.showTestimonial(nextIndex);
    }, settings.autoRotateTime);
  }

}
