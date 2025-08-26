import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Word, WordType, ArticleType, Kasus, Preposition } from '../models/word.model';
import { WordImportService } from './word-import.service';
import { WordListStorageService } from './word-list-storage.service';
import { VocabularyVersionService } from './vocabulary-version.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {

  private wordImportService = inject(WordImportService);
  private wordListStorageService = inject(WordListStorageService);
  private vocabularyVersionService = inject(VocabularyVersionService);

  constructor(private http: HttpClient) { }

  public updateVocabulary(updateStrategy: 'merge' | 'add-only'): void {
    const standardWordsUrl = 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/main/standard.csv';
    const verbsUrl = 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/main/verbs.csv';

    this.createWordListIfNotExists('Standard');
    this.createWordListIfNotExists('Verben');

    const standardList = this.wordListStorageService.getWordListByName('Standard');
    const verbsList = this.wordListStorageService.getWordListByName('Verben');

    if (standardList) {
      this.wordImportService.importWords(standardWordsUrl, standardList.id, updateStrategy).subscribe();
    }
    if (verbsList) {
      this.wordImportService.importWords(verbsUrl, verbsList.id, updateStrategy).subscribe();
    }

    this.vocabularyVersionService.getRemoteVersion().subscribe(version => {
      if (version !== null) {
        this.vocabularyVersionService.setLocalVersion(version);
      }
    });
  }

  private createWordListIfNotExists(name: string): void {
    let wordList = this.wordListStorageService.getWordListByName(name);
    if (!wordList) {
      const newWordList = {
        id: this.generateUniqueId(),
        name: name
      };
      this.wordListStorageService.createWordList(newWordList);
    }
  }

  private generateUniqueId(): string {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }

  importWordsFromCsv(csvUrl: string): Observable<Word[]> {
    return this.http.get(csvUrl, { responseType: 'text' }).pipe(
      map(csvText => this.parseCsv(csvText))
    );
  }

  private parseCsv(csvText: string): Word[] {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      return [];
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const words: Word[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed row: ${lines[i]}`);
        continue;
      }

      const word: Partial<Word> = {};
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header) {
          case 'originalWord':
            word.originalWord = value;
            break;
          case 'translation':
            word.translation = value;
            break;
          case 'description':
            word.description = value;
            break;
          case 'wordType':
            word.wordType = value as WordType; // Type assertion
            break;
          case 'article':
            word.article = value as ArticleType; // Type assertion
            break;
          case 'preposition':
            word.preposition = value as Preposition;
            break;
          case 'kasus':
            word.kasus = value as Kasus; // Type assertion
            break;
          case 'reflexive':
            word.reflexive = value.toLowerCase() === 'true';
            break;
          default:
            console.warn(`Unknown header: ${header}`);
        }
      });

      // Basic validation for required fields
      if (word.originalWord && word.translation && word.wordType) { // Removed word.id
        words.push(word as Word);
      } else {
        console.warn(`Skipping word due to missing required fields: ${JSON.stringify(word)}`);
      }
    }
    return words;
  }
}