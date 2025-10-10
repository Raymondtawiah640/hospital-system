import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardHighlight } from '../dashboard-highlight/dashboard-highlight';
import { DashboardSummary } from '../dashboard-summary/dashboard-summary';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, DashboardHighlight, DashboardSummary],
})
export class Dashboard implements OnInit {
  slides: Slide[] = [
    { image: 'med.png', title: 'Welcome to Our Hospital', subtitle: 'Providing Quality Care Every Day' },
    { image: 'med1.png', title: 'Expert Medical Team', subtitle: 'Caring for You with Compassion' },
    { image: 'med2.png', title: 'Advanced Facilities', subtitle: 'Modern Equipment for Better Health' }
  ];

  currentSlide = 0;

  ngOnInit(): void {
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 4000);
  }
}
