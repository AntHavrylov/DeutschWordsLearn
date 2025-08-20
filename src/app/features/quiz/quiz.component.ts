import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../core/services/quiz.service';
import { StatsService } from '../../core/services/stats.service'; // Import StatsService
import { QuizWord, QuizResults } from '../../core/models/quiz.model';
import { WordType, Kasus, ArticleType, Preposition } from '../../core/models/word.model'; // Import WordType, Kasus, and ArticleType
import { WordListStorageService } from '../../core/services/word-list-storage.service'; // Added this
import { WordList } from '../../core/models/word-list.model'; // Added this
import { FormsModule } from '@angular/forms'; // Added FormsModule for select

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule], // Added FormsModule
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  currentWord: QuizWord | undefined;
  results: QuizResults | null = null;
  showDescription = false;
  selectedOption: string | null = null;
  selectedArticle: string | null = null;
  selectedPreposition: Preposition | null = null; // New property
  selectedKasus: Kasus | null = null; // New property

  wordLists: WordList[] = []; // Added this
  selectedListId: string = ''; // Added this

  // Expose WordType, Kasus, and ArticleType to the template
  WordType = WordType;
  Kasus = Kasus;
  ArticleType = ArticleType;

  constructor(
    public quizService: QuizService,
    private statsService: StatsService,
    private wordListStorageService: WordListStorageService // Added this
  ) { }

  ngOnInit(): void {
    this.wordLists = this.wordListStorageService.getWordLists();
    if (this.wordLists.length > 0 && !this.selectedListId) { // Only set if not already selected
      this.selectedListId = this.wordLists[0].id; // Select the first list by default
    }
  }

  startQuiz(): void {
    if (this.quizService.initializeQuiz(10, this.selectedListId)) { // Pass selectedListId
      this.results = null;
      this.updateCurrentWord();
    }
  }

  updateCurrentWord(): void {
    if (this.quizService.session) {
      this.currentWord = this.quizService.session.words[this.quizService.session.currentIndex];
      this.selectedOption = null;
      this.selectedArticle = null;
      this.selectedPreposition = null; // Reset new property
      this.selectedKasus = null; // Reset new property
    }
  }

  selectOption(option: string): void {
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedOption = option;
    }
  }

  selectArticle(article: string): void {
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedArticle = article;
    }
  }

  selectPreposition(preposition: Preposition): void { // New method
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedPreposition = preposition;
    }
  }

  selectKasus(kasus: Kasus): void { // New method
    if (this.currentWord && this.currentWord.answer === null) {
      this.selectedKasus = kasus;
    }
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  next(): void {
    if (!this.quizService.session || !this.currentWord) return;

    if (this.currentWord.answer === null) {
      if (this.currentWord.isReverse) { // Levels 3-7: translation shown, guess original word/parts
        if (this.currentWord.wordType === WordType.Noun) {
          this.quizService.handleAnswer(
            this.selectedOption || '',
            this.selectedArticle ? (this.selectedArticle as ArticleType) : undefined
          );
        } else if (this.currentWord.wordType === WordType.Verb) {
          this.quizService.handleAnswer(
            this.selectedOption || '',
            undefined,
            this.selectedPreposition || undefined,
            this.selectedKasus || undefined
          );
        } else { // For other word types
          this.quizService.handleAnswer(
            this.selectedOption || ''
          );
        }
      } else { // Levels 0-2: original word shown, guess translation
        if (this.selectedOption) {
          this.quizService.handleAnswer(
            this.selectedOption,
            this.selectedArticle ? (this.selectedArticle as ArticleType) : undefined,
            this.selectedPreposition || undefined,
            this.selectedKasus || undefined
          );
        }
      }
    } else {
      this.quizService.nextCard();
      if (this.quizService.session.endTime) {
        this.results = this.quizService.endQuiz();
        if (this.results) {
          this.statsService.updateStats(this.results);
        }
      } else {
        this.updateCurrentWord();
      }
    }
  }
}