import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Word } from '../../core/models/word.model';
import { WordStorageService } from '../../core/services/word-storage.service';
import { MAX_LEARNING_LEVEL, MIN_LEARNING_LEVEL } from '../../core/constants/learning-levels';

@Component({
  selector: 'app-word-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-list.component.html',
  styleUrls: ['./word-list.component.css']
})
export class WordListComponent implements OnInit {
  words: Word[] = [];
  filteredWords: Word[] = [];
  searchTerm = '';
  isVisible = true;
  viewMode: 'list' | 'grid' = 'grid';

  constructor(private wordStorageService: WordStorageService) { }

  ngOnInit(): void {
    this.loadWords();
  }

  loadWords(): void {
    this.words = this.wordStorageService.getWords();
    this.filterWords();
  }

  filterWords(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredWords = this.words.filter(word =>
      word.originalWord.toLowerCase().includes(term) || // Changed word.word to word.originalWord
      word.translation.toLowerCase().includes(term)
    );
  }

  deleteWord(originalWord: string): void {
    if (confirm(`Are you sure you want to delete "${originalWord}"?`)) {
      this.wordStorageService.deleteWord(originalWord);
      this.loadWords();
    }
  }

  toggleList(): void {
    this.isVisible = !this.isVisible;
  }

  resetAllProgress(): void {
    if (confirm('Möchten Sie den Lernfortschritt für alle angezeigten Wörter wirklich zurücksetzen?')) {
      this.filteredWords.forEach(word => {
        word.learningLevel = MIN_LEARNING_LEVEL;
        word.learnStatus = 0;
        this.wordStorageService.addOrUpdateWord(word);
      });
      this.loadWords(); // Refresh the list after updating all words
    }
  }

  iKnowThisWord(word: Word): void {
    word.learningLevel = MAX_LEARNING_LEVEL;
    word.learnStatus = 7; // Set learnStatus to 7 (100%)
    this.wordStorageService.addOrUpdateWord(word);
    this.loadWords(); // Refresh the list
  }

  resetLearningLevel(word: Word): void {
    word.learningLevel = MIN_LEARNING_LEVEL;
    word.learnStatus = 0; // Reset learnStatus to 0
    this.wordStorageService.addOrUpdateWord(word);
    this.loadWords(); // Refresh the list
  }
}