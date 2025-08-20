import { Injectable } from '@angular/core';
import { Word, ArticleType } from '../models/word.model';

@Injectable({
  providedIn: 'root'
})
export class WordStorageService {
  private readonly WORDS_STORAGE_KEY = 'words';

  constructor() { }

  getWords(): Word[] {
    try {
      const localData = localStorage.getItem(this.WORDS_STORAGE_KEY);
      const words = localData ? JSON.parse(localData) : [];
      return words;
    } catch (error) {
      console.error("Error getting words:", error);
      return [];
    }
  }

  saveWord(wordObject: Word): boolean {
    try {
      if (!wordObject || !wordObject.originalWord || !wordObject.translation) {
        throw new Error("Invalid word object");
      }

      const words = this.getWords();

      // Check for duplicate originalWord
      if (words.some(word => word.originalWord === wordObject.originalWord)) {
        console.warn("Duplicate word detected. Skipping update."); // Changed error to warn
        return true; // Indicate success, but no change was made
      }

      words.push(wordObject);
      this.saveWordsToLocalStorage(words);
      return true;
    } catch (error) {
      console.error("Error saving word:", error);
      return false;
    }
  }

  deleteWord(originalWord: string): boolean {
    try {
      let words = this.getWords();
      const initialLength = words.length;
      words = words.filter(word => word.originalWord !== originalWord);
      if (words.length < initialLength) {
        this.saveWordsToLocalStorage(words);
        return true;
      }
      return false; // Word not found
    } catch (error) {
      console.error("Error deleting word:", error);
      return false;
    }
  }

  updateWord(originalWord: string, updatedWordObject: Word): boolean {
    try {
      if (!updatedWordObject || !updatedWordObject.originalWord || !updatedWordObject.translation) {
        throw new Error("Invalid word object");
      }
      let words = this.getWords();
      const index = words.findIndex(word => word.originalWord === originalWord);
      if (index !== -1) {
        words[index] = updatedWordObject;
        this.saveWordsToLocalStorage(words);
        return true;
      }
      return false; // Word not found
    } catch (error) {
      console.error("Error updating word:", error);
      return false;
    }
  }

  clearAllWords(): boolean {
    try {
      localStorage.removeItem(this.WORDS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing all words:", error);
      return false;
    }
  }

  exportWords(): string | null {
    try {
      const words = this.getWords();
      const replacer = (key: string, value: any) => {
        // Exclude learnStatus from the output
        if (key === 'learnStatus') {
          return undefined;
        }
        return value;
      };
      return JSON.stringify(words, replacer, 2);
    } catch (error) {
      console.error("Error exporting words:", error);
      return null;
    }
  }

  importWords(jsonString: string): boolean {
    try {
      const words: Word[] = JSON.parse(jsonString);
      if (!Array.isArray(words)) {
        throw new Error("Invalid JSON format: must be an array of word objects.");
      }
      // Basic validation of each object
      for (const word of words) {
        if (!word || !word.originalWord || !word.translation) {
          throw new Error("Invalid word object in JSON string.");
        }
        // Ensure article property exists, default to ArticleType.None if not
        if (word.article === undefined) {
          word.article = ArticleType.None;
        }
      }
      this.saveWordsToLocalStorage(words);
      return true;
    } catch (error) {
      console.error("Error importing words:", error);
      return false;
    }
  }

  mergeWords(jsonString: string): number {
    try {
      const newWords: Word[] = JSON.parse(jsonString);
      if (!Array.isArray(newWords)) {
        throw new Error("Invalid JSON format: must be an array of word objects.");
      }

      const existingWords = this.getWords();
      const existingWordSet = new Set(existingWords.map(word => word.originalWord));
      let importedCount = 0;

      for (const word of newWords) {
        if (!word || !word.originalWord || !word.translation) {
          console.error("Invalid word object in JSON string, skipping:", word);
          continue;
        }
        // Ensure article property exists, default to ArticleType.None if not
        if (word.article === undefined) {
          word.article = ArticleType.None;
        }
        if (!existingWordSet.has(word.originalWord)) {
          if (word.learnStatus === undefined) {
            word.learnStatus = 0;
          }
          existingWords.push(word);
          existingWordSet.add(word.originalWord);
          importedCount++;
        }
      }

      this.saveWordsToLocalStorage(existingWords);
      return importedCount;
    } catch (error) {
      console.error("Error importing words:", error);
      return 0;
    }
  }

  private saveWordsToLocalStorage(words: Word[]): void {
    try {
      localStorage.setItem(this.WORDS_STORAGE_KEY, JSON.stringify(words));
    } catch (error) {
      console.error("Error saving words to localStorage:", error);
    }
  }

  setCookie(name: string, value: string, days: number): void {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  updateWordLearnStatus(originalWord: string, isCorrect: boolean): void {
    const words = this.getWords();
    const wordIndex = words.findIndex(w => w.originalWord === originalWord);
    if (wordIndex > -1) {
      const word = words[wordIndex];
      if (isCorrect) {
        word.learnStatus = (word.learnStatus || 0) + 1;
      } else {
        word.learnStatus = Math.max(0, (word.learnStatus || 0) - 1);
      }
      this.saveWordsToLocalStorage(words);
    }
  }
}