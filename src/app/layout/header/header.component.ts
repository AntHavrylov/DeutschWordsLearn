import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf/ngFor if needed in template

@Component({
  selector: 'app-header',
  standalone: true, // Ensure standalone is true if not already
  imports: [CommonModule], // Add CommonModule
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() navigate = new EventEmitter<string>();

  isHeaderExpanded: boolean = true;
  private lastScrollTop: number = 0;
  private SCROLL_THRESHOLD = 50; // Pixels to scroll before shrinking/expanding

  @HostListener('window:scroll', ['$event'])
  
  onWindowScroll() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > this.lastScrollTop && currentScrollTop > this.SCROLL_THRESHOLD) {
      // Scrolling down and past threshold
      this.isHeaderExpanded = false;
    } else if (currentScrollTop < this.lastScrollTop || currentScrollTop <= this.SCROLL_THRESHOLD) {
      // Scrolling up or near the top
      this.isHeaderExpanded = true;
    }

    this.lastScrollTop = currentScrollTop;
  }

  onNavigate(page: string): void {
    this.navigate.emit(page);
  }
}