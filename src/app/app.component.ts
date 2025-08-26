import { FormsModule } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { QuizComponent } from './features/quiz/quiz.component';
import { StatsComponent } from './features/stats/stats.component';
import { ManageVocabularyComponent } from './features/manage-vocabulary/manage-vocabulary.component'; // Added this
import { VocabularyVersionService } from './core/services/vocabulary-version.service';
import { GoogleSheetsService } from './core/services/google-sheets.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    QuizComponent,
    StatsComponent,
    ManageVocabularyComponent // Added this
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public vocabularyVersionService = inject(VocabularyVersionService);
  private googleSheetsService = inject(GoogleSheetsService);

  title = 'Wortlernen-Angular';
  currentPage: string = 'quiz'; // Default page
  updateStrategy: 'merge' | 'add-only' = 'add-only';

  navigateTo(page: string): void {
    this.currentPage = page;
  }

  ngOnInit(): void {
    this.vocabularyVersionService.checkVocabularyVersion();
  }

  handleUpdate(): void {
    this.googleSheetsService.updateVocabulary(this.updateStrategy);
    this.vocabularyVersionService.isUpdateModalVisible.set(false);
  }
}