import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() navigate = new EventEmitter<string>();

  isHeaderExpanded: boolean = true;
  private lastScrollTop: number = 0;
  private SCROLL_THRESHOLD = 50;
  private scrollTimeout: any;

  @HostListener('window:scroll', ['$event'])
  
  onWindowScroll() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop <= this.SCROLL_THRESHOLD) {
        this.isHeaderExpanded = true;
      } else {
        this.isHeaderExpanded = false;
      }

      this.lastScrollTop = currentScrollTop;
    }, 100);
  }

  onNavigate(page: string): void {
    this.navigate.emit(page);
  }
}