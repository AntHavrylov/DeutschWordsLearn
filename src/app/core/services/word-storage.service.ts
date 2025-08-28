import { Injectable } from '@angular/core';
import { Word, ArticleType, Kasus, WordType } from '../models/word.model';
import { MIN_LEARNING_LEVEL, MAX_LEARNING_LEVEL } from '../constants/learning-levels';
import { v4 as uuidv4 } from 'uuid';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WordStorageService {
  private readonly WORDS_STORAGE_KEY = 'words';
  private wordListKeys!: Record<string, Set<string>>;

  constructor() {
    this.wordListKeys = {};
  }

  getWords(): Word[] {
    try {
      const localData = localStorage.getItem(this.WORDS_STORAGE_KEY);
      const words = localData ? JSON.parse(localData) : [];
      // Ensure learningLevel is initialized for existing words
      return words.map((word: Word) => ({
        ...word,
        id: word.id || uuidv4(), // Assign a new ID if missing
        learningLevel: word.learningLevel === undefined ? MIN_LEARNING_LEVEL : word.learningLevel,
        article: word.article === ArticleType.None ? undefined : word.article,
        preposition: word.preposition || undefined,
        kasus: word.kasus === Kasus.None ? undefined : word.kasus
      }));
    } catch (error) {
      console.error("Error getting words:", error);
      return [];
    }
  }

  getWordById(id: string): Word | undefined {
    return this.getWords().find(word => word.id === id);
  }

  private generateWordKey(word: Word): string {
    let key = word.originalWord.toLowerCase();

    switch (word.wordType) {
      case WordType.Verb:
        key += `_reflexive:${word.reflexive || false}`;
        key += `_preposition:${(word.preposition || '').toLowerCase()}`;
        break;
      case WordType.Noun:
        key = `${(word.article || '').toLowerCase()}_${key}`;
        break;
      default:
        // For other types, originalWord is sufficient
        break;
    }
    return key;
  }

  addWord(wordObject: Word): boolean {
    try {
      if (!wordObject || !wordObject.originalWord || !wordObject.translation) {
        throw new Error("Invalid word object");
      }
      const newWordKey = this.generateWordKey(wordObject);
      // Initialize learningLevel if not provided
      if (wordObject.learningLevel === undefined) {
        wordObject.learningLevel = MIN_LEARNING_LEVEL;
      }

      let words = this.getWords();
      words.push(wordObject);
      if (!this.wordListKeys[wordObject.listId]) {
        this.wordListKeys[wordObject.listId] = new Set<string>();
      }
      this.wordListKeys[wordObject.listId].add(newWordKey);
      this.saveWordsToLocalStorage(words);
      return true;
    } catch (error) {
      console.error("Error adding word:", error);
      return false;
    }
  }

  addOrUpdateWord(wordObject: Word, updateStrategy: 'merge' | 'add-only' = 'merge'): boolean {
    if (Object.keys(this.wordListKeys).length == 0) {
      this.getWords().forEach(w => {
        if (!this.wordListKeys[w.listId]) {
          this.wordListKeys[w.listId] = new Set<string>();
        }
        this.wordListKeys[w.listId].add(this.generateWordKey(w));
      })
    }

    const existingWord =
      this.wordListKeys[wordObject.listId] &&
      this.wordListKeys[wordObject.listId].has(this.generateWordKey(wordObject));

    if (existingWord && updateStrategy === 'merge') {
      return this.updateWord(wordObject);
    }
    if (!existingWord) {
      return this.addWord(wordObject);
    }
    return false;
  }

  findWordIndex(originalWord: Word, words: Word[]) {
    const index = words.findIndex(word =>
      (word.wordType == WordType.Verb && word.originalWord === originalWord.originalWord && word.preposition === originalWord.preposition) ||
      (word.wordType == WordType.Noun && word.originalWord === originalWord.originalWord && word.article === originalWord.article) ||
      word.originalWord === originalWord.originalWord
    );
    return index;
  }

  updateWord(updatedWordObject: Word): boolean {
    try {
      if (!updatedWordObject || !updatedWordObject.originalWord || !updatedWordObject.translation) {
        throw new Error("Invalid word object");
      }
      let words = this.getWords();
      const index = this.findWordIndex(updatedWordObject, words);
      if (index !== -1) {
        const learningLevel = words[index].learningLevel;
        const learnStatus = words[index].learnStatus;
        words[index] = updatedWordObject;
        words[index].learningLevel = learningLevel;
        words[index].learnStatus = learnStatus;
        this.saveWordsToLocalStorage(words);
        return true;
      }
      return false; 

    } catch (error) {
      console.error("Error updating word:", error);
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

  deleteWordById(id: string): boolean {
    try {
      let words = this.getWords();
      const initialLength = words.length;
      words = words.filter(word => word.id !== id);
      if (words.length < initialLength) {
        this.saveWordsToLocalStorage(words);
        return true;
      }
      return false; // Word not found
    } catch (error) {
      console.error("Error deleting word by ID:", error);
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
        if (word.learningLevel === undefined) {
          word.learningLevel = MIN_LEARNING_LEVEL;
        }
        if (word.kasus === undefined) {
          word.kasus = Kasus.None;
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
        if (word.kasus === undefined) {
          word.kasus = Kasus.None;
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

  updateWordLearnStatus(originalWord: Word, isCorrect: boolean): void {
    if (originalWord) {
      if (isCorrect) {
        originalWord.learnStatus = Math.min(MAX_LEARNING_LEVEL, (originalWord.learnStatus || MIN_LEARNING_LEVEL) + 1);
      } else {
        originalWord.learnStatus = Math.max(MIN_LEARNING_LEVEL, (originalWord.learnStatus || MIN_LEARNING_LEVEL) - 1);
      }
      originalWord.learningLevel = originalWord.learnStatus;
      this.addOrUpdateWord(originalWord);
    }
  }
}
