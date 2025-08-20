import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { QuizComponent } from './features/quiz/quiz.component';
import { StatsComponent } from './features/stats/stats.component';
import { ManageVocabularyComponent } from './features/manage-vocabulary/manage-vocabulary.component'; // Added this

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    QuizComponent,
    StatsComponent,
    ManageVocabularyComponent // Added this
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Wortlernen-Angular';
  currentPage: string = 'quiz'; // Default page

  navigateTo(page: string): void {
    this.currentPage = page;
  }
}