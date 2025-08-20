import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WordListStorageService } from '../../core/services/word-list-storage.service';
import { WordList } from '../../core/models/word-list.model';
import { WordStorageService } from '../../core/services/word-storage.service';
import { Word } from '../../core/models/word.model';
import { v4 as uuidv4 } from 'uuid';

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
        wordIds: []
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
      list.wordIds.includes(word.originalWord) // Changed word.id to word.originalWord
    );
    this.updateAvailableWordsToAdd();
  }

  deleteList(listId: string): void {
    if (confirm('Are you sure you want to delete this list?')) {
      this.wordListStorageService.deleteWordList(listId);
      this.selectedList = null;
      this.wordsInSelectedList = [];
      this.loadWordLists();
    }
  }

  addWordToList(): void {
    if (this.selectedList && this.selectedWordToAdd) {
      this.wordListStorageService.addWordToWordList(this.selectedList.id, this.selectedWordToAdd); // selectedWordToAdd is already originalWord
      this.selectedWordToAdd = '';
      this.loadWordLists();
    }
  }

  removeWordFromList(originalWord: string): void { // Changed wordId to originalWord
    if (this.selectedList && confirm('Are you sure you want to remove this word from the list?')) {
      this.wordListStorageService.removeWordFromWordList(this.selectedList.id, originalWord); // Changed wordId to originalWord
      this.loadWordLists();
    }
  }

  updateAvailableWordsToAdd(): void {
    if (this.selectedList) {
      this.availableWordsToAdd = this.allWords.filter(word =>
        !this.selectedList!.wordIds.includes(word.originalWord) // Changed word.id to word.originalWord
      );
    } else {
      this.availableWordsToAdd = [];
    }
  }
}