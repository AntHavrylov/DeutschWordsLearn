import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WordListStorageService } from '../../core/services/word-list-storage.service';
import { WordList } from '../../core/models/word-list.model';
import { WordStorageService } from '../../core/services/word-storage.service';
import { Word } from '../../core/models/word.model';
import { v4 as uuidv4 } from 'uuid';
import { MAX_LEARNING_LEVEL, MIN_LEARNING_LEVEL } from '../../core/constants/learning-levels';

@Component({
  selector: 'app-word-list-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-list-manager.component.html',
  styleUrls: ['./word-list-manager.component.css']
})
export class WordListManagerComponent implements OnInit {
  wordLists: WordList[] = [];
  newListName: string = '';
  selectedList: WordList | null = null;
  allWords: Word[] = [];
  wordsInSelectedList: Word[] = [];
  availableWordsToAdd: Word[] = [];
  selectedWordToAdd: string = ''; // Stores word originalWord
  public readonly MAX_LEARNING_LEVEL = MAX_LEARNING_LEVEL;

  constructor(
    private wordListStorageService: WordListStorageService,
    private wordStorageService: WordStorageService
  ) { }

  ngOnInit(): void {
    this.loadWordLists();
    this.loadAllWords();
  }

  loadWordLists(): void {
    this.wordLists = this.wordListStorageService.getWordLists();
    // If no list is selected, and there are lists, select the first one
    if (!this.selectedList && this.wordLists.length > 0) {
      this.selectList(this.wordLists[0]);
    } else if (this.selectedList) {
      // Re-select the current list to refresh its words
      this.selectList(this.selectedList);
    }
  }

  loadAllWords(): void {
    this.allWords = this.wordStorageService.getWords();
    this.updateAvailableWordsToAdd();
  }

  createList(): void {
    if (this.newListName.trim()) {
      const newList: WordList = {
        id: uuidv4(),
        name: this.newListName.trim(),
      };
      this.wordListStorageService.saveWordList(newList);
      this.newListName = '';
      this.loadWordLists();
      this.selectList(newList);
    }
  }

  selectList(list: WordList): void {
    this.selectedList = list;
    this.wordsInSelectedList = this.allWords.filter(word =>
      word.listId === list.id
    );
    this.updateAvailableWordsToAdd();
  }

  deleteList(listId: string): void {
    if (confirm('Are you sure you want to delete this list?')) {
      this.wordListStorageService.deleteWordList(listId);
      this.selectedList = null;
      this.wordsInSelectedList = [];
      this.loadWordLists();
      this.loadAllWords(); // Reload all words to reflect changes after list deletion
    }
  }

  addWordToList(): void {
    if (this.selectedList && this.selectedWordToAdd) {
      const wordToUpdate = this.allWords.find(word => word.originalWord === this.selectedWordToAdd);
      if (wordToUpdate && this.selectedList) {
        wordToUpdate.listId = this.selectedList.id;
        this.wordStorageService.addOrUpdateWord(wordToUpdate);
        this.selectedWordToAdd = ''; // Clear selection
        this.loadAllWords(); // Reload all words to update available words and words in list
        this.selectList(this.selectedList); // Re-select list to refresh display
      }
    }
  }

  removeWordFromListOnly(originalWord: string): void {
    if (this.selectedList && confirm('Are you sure you want to remove this word from the list?')) {
      const wordToUpdate = this.allWords.find(word => word.originalWord === originalWord);
      if (wordToUpdate) {
        wordToUpdate.listId = ''; // Set to empty string to indicate no list
        this.wordStorageService.addOrUpdateWord(wordToUpdate);
        this.loadAllWords(); // Reload all words to update available words and words in list
        this.selectList(this.selectedList); // Re-select list to refresh display
      }
    }
  }

  deleteWord(wordId: string): void {
    if (confirm(`Are you sure you want to delete this word permanently?`)) {
      this.wordStorageService.deleteWordById(wordId);
      this.loadAllWords(); // Refresh all words
      if (this.selectedList) {
        this.selectList(this.selectedList); // Re-select list to refresh display
      }
    }
  }

  iKnowThisWord(word: Word): void {
    word.learningLevel = MAX_LEARNING_LEVEL;
    word.learnStatus = MAX_LEARNING_LEVEL;
    this.wordStorageService.addOrUpdateWord(word);
    this.loadAllWords(); // Refresh the list
    if (this.selectedList) {
      this.selectList(this.selectedList); // Re-select list to refresh display
    }
  }

  resetLearningLevel(word: Word): void {
    word.learningLevel = MIN_LEARNING_LEVEL;
    word.learnStatus = MIN_LEARNING_LEVEL;
    this.wordStorageService.addOrUpdateWord(word);
    this.loadAllWords(); // Refresh the list
    if (this.selectedList) {
      this.selectList(this.selectedList); // Re-select list to refresh display
    }
  }

  updateAvailableWordsToAdd(): void {
    if (this.selectedList) {
      this.availableWordsToAdd = this.allWords.filter(word =>
        word.listId !== this.selectedList!.id
      );
    } else {
      this.availableWordsToAdd = [];
    }
  }

  getWordCountForList(listId: string): number {
    return this.allWords.filter(word => word.listId === listId).length;
  }
}