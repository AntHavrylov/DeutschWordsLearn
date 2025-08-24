import { Injectable } from '@angular/core';
import { WordList } from '../models/word-list.model';
import { WordStorageService } from './word-storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Word } from '../models/word.model'; // Import Word model

@Injectable({
  providedIn: 'root'
})
export class WordListStorageService {
  private readonly WORD_LISTS_STORAGE_KEY = 'wordLists';

  constructor(private wordStorageService: WordStorageService) { }

  getWordLists(): WordList[] {
    try {
      const localData = localStorage.getItem(this.WORD_LISTS_STORAGE_KEY);
      let wordLists: WordList[] = localData ? JSON.parse(localData) : [];

      if (wordLists.length === 0) {
        // Initialize with default list if no lists exist
        const defaultList: WordList = {
          id: uuidv4(), // Use a fixed ID for the default list
          name: 'Meine erste Liste',
        };
        wordLists.push(defaultList);
        this.saveWordListsToLocalStorage(wordLists); // Save the default list
      }
      return wordLists;
    } catch (error) {
      console.error("Fehler beim Abrufen der Wortlisten:", error);
      return [];
    }
  }

  saveWordList(wordList: WordList): boolean {
    try {
      let wordLists = this.getWordLists();
      const index = wordLists.findIndex(list => list.id === wordList.id);

      if (index !== -1) {
        // Update existing list
        wordLists[index] = wordList;
      } else {
        // Add new list
        wordLists.push(wordList);
      }
      this.saveWordListsToLocalStorage(wordLists);
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern der Wortliste:", error);
      return false;
    }
  }

  deleteWordList(listId: string): boolean {
    try {
      console.log('Versuche, Liste mit ID zu löschen:', listId);
      let wordLists = this.getWordLists();
      console.log('Aktuelle Wortlisten (vor Filterung):', JSON.stringify(wordLists));

      const listToDelete = wordLists.find(list => list.id === listId);
      if (!listToDelete) {
        console.log(`Liste mit ID '${listId}' nicht gefunden.`);
        return false;
      }

      // Delete all words associated with this list
      const allWords = this.wordStorageService.getWords();
      const wordsToDelete = allWords.filter((word: Word) => word.listId === listId);
      wordsToDelete.forEach((word: Word) => {
        this.wordStorageService.deleteWordById(word.id);
      });

      const initialLength = wordLists.length;
      wordLists = wordLists.filter(list => list.id !== listId);

      if (wordLists.length < initialLength) {
        this.saveWordListsToLocalStorage(wordLists);
        console.log(`Liste '${listToDelete.name}' (ID: ${listId}) erfolgreich gelöscht und gespeichert.`);
        return true;
      }
      console.log('Liste wurde gefunden, aber nicht gelöscht (Filterproblem?).');
      return false;
    } catch (error) {
      console.error("Fehler beim Löschen der Wortliste:", error);
      return false;
    }
  }

  private saveWordListsToLocalStorage(wordLists: WordList[]): void {
    try {
      localStorage.setItem(this.WORD_LISTS_STORAGE_KEY, JSON.stringify(wordLists));
    } catch (error) {
      console.error("Fehler beim Speichern der Wortlisten im lokalen Speicher:", error);
    }
  }
}