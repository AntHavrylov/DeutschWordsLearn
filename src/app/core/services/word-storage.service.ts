import { Injectable } from '@angular/core';
import { Word, ArticleType } from '../models/word.model';
import { MIN_LEARNING_LEVEL, MAX_LEARNING_LEVEL } from '../constants/learning-levels';
import { v4 as uuidv4 } from 'uuid';

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
      // Ensure learningLevel is initialized for existing words
      return words.map((word: Word) => ({
        ...word,
        id: word.id || uuidv4(), // Assign a new ID if missing
        learningLevel: word.learningLevel === undefined ? MIN_LEARNING_LEVEL : word.learningLevel
      }));
    } catch (error) {
      console.error("Error getting words:", error);
      return [];
    }
  }

  getWordById(id: string): Word | undefined {
    return this.getWords().find(word => word.id === id);
  }

  addWord(wordObject: Word): boolean {
    try {
      if (!wordObject || !wordObject.originalWord || !wordObject.translation) {
        throw new Error("Invalid word object");
      }

      const words = this.getWords();

      // Check for duplicate originalWord
      if (words.some(word => word.originalWord === wordObject.originalWord)) {
        console.warn("Duplicate word detected. Word with originalWord '" + wordObject.originalWord + "' already exists.");
        return false; // Indicate failure to add due to duplicate
      }

      // Initialize learningLevel if not provided
      if (wordObject.learningLevel === undefined) {
        wordObject.learningLevel = MIN_LEARNING_LEVEL;
      }

      words.push(wordObject);
      this.saveWordsToLocalStorage(words);
      return true;
    } catch (error) {
      console.error("Error adding word:", error);
      return false;
    }
  }

  addOrUpdateWord(wordObject: Word): boolean {
    const existingWord = this.getWordById(wordObject.id);
    if (existingWord) {
      return this.updateWord(wordObject);
    } else {
      return this.addWord(wordObject);
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

  updateWord(updatedWordObject: Word): boolean {
    try {
      if (!updatedWordObject || !updatedWordObject.originalWord || !updatedWordObject.translation) {
        throw new Error("Invalid word object");
      }
      let words = this.getWords();
      const index = words.findIndex(word => word.id === updatedWordObject.id);
      if (index !== -1) {
        // Ensure learningLevel is initialized if not provided in the updated object
        if (updatedWordObject.learningLevel === undefined) {
          updatedWordObject.learningLevel = MIN_LEARNING_LEVEL;
        }
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
      // Ensure learningLevel property exists, default to MIN_LEARNING_LEVEL if not
        if (word.learningLevel === undefined) {
          word.learningLevel = MIN_LEARNING_LEVEL;
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
        // Ensure learningLevel property exists, default to MIN_LEARNING_LEVEL if not
        if (word.learningLevel === undefined) {
          word.learningLevel = MIN_LEARNING_LEVEL;
        }
        if (!existingWordSet.has(word.originalWord)) {
          if (word.learnStatus === undefined) {
            word.learnStatus = MIN_LEARNING_LEVEL;
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
        word.learnStatus = Math.min(MAX_LEARNING_LEVEL, (word.learnStatus || MIN_LEARNING_LEVEL) + 1);
      } else {
        word.learnStatus = Math.max(MIN_LEARNING_LEVEL, (word.learnStatus || MIN_LEARNING_LEVEL) - 1);
      }
      word.learningLevel = word.learnStatus;
      this.addOrUpdateWord(word);
    }
  }
}
