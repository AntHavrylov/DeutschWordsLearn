import { Component, Output, EventEmitter } from '@angular/core';
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

  onNavigate(page: string): void {
    this.navigate.emit(page);
  }
}
