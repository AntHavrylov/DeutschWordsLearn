import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit {

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.document.body.classList.add(savedTheme);
    }
  }

  toggleTheme(): void {
    if (this.document.body.classList.contains('high-contrast')) {
      this.document.body.classList.remove('high-contrast');
      localStorage.removeItem('theme');
    } else {
      this.document.body.classList.add('high-contrast');
      localStorage.setItem('theme', 'high-contrast');
    }
  }
}
