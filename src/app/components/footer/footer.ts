import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
openSection: string | null = null;

toggleSection(section: string) {
  this.openSection = this.openSection === section ? null : section;
}
}