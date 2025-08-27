import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Word, WordType, ArticleType, Kasus, Preposition } from '../models/word.model';
import { WordStorageService } from './word-storage.service';
import { WordListStorageService } from './word-list-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class WordImportService {

  private http = inject(HttpClient);
  private wordStorageService = inject(WordStorageService);
  private wordListStorageService = inject(WordListStorageService);

  constructor() { }

  importWords(csvUrl: string, listId: string, updateStrategy: 'merge' | 'add-only'): Observable<{ success: boolean, importedCount: number, totalCount: number, errors: any[] }> {
    console.log(`WordImportService: importWords called for URL: ${csvUrl}, listId: ${listId}, strategy: ${updateStrategy}`);
    return this.importWordsFromCsv(csvUrl).pipe(
      map(wordsToImport => {
        console.log(`WordImportService: ${wordsToImport.length} words to import.`);
        const errors: any[] = [];
        let importedCount = 0;

        wordsToImport.forEach(word => {
          try {
            if (!word.id) {
              word.id = uuidv4();
            }
            word.listId = listId;

            let result = this.wordStorageService.addOrUpdateWord(word, updateStrategy);
            if (!result) {
              errors.push('+');
            }

          } catch (e) {
            errors.push({ word: word.originalWord, error: e });
            console.error(`WordImportService: Error processing word ${word.originalWord}:`, e);
          }
        });

        console.log(`WordImportService: Import finished. Imported: ${importedCount}, Total: ${wordsToImport.length}, Errors: ${errors.length}`);
        return {
          success: errors.length === 0,
          importedCount: importedCount,
          totalCount: wordsToImport.length,
          errors: errors
        };
      }),
      catchError(error => {
        console.error('Error importing words:', error);
        return new Observable<{ success: boolean, importedCount: number, totalCount: number, errors: any[] }>(observer => {
          observer.next({ success: false, importedCount: 0, totalCount: 0, errors: [error] });
          observer.complete();
        });
      })
    );
  }

  private importWordsFromCsv(csvUrl: string): Observable<Word[]> {
    return this.http.get(csvUrl, { responseType: 'text' }).pipe(
      map(csvText => this.parseCsv(csvText))
    );
  }

  private parseCsv(csvText: string): Word[] {
    console.log('WordImportService: parseCsv called.');
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      console.warn('WordImportService: CSV text is empty or contains only whitespace.');
      return [];
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const words: Word[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) {
        console.warn(`WordImportService: Skipping malformed row: ${lines[i]}`);
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
            word.wordType = value as WordType;
            break;
          case 'article':
            word.article = value as ArticleType;
            break;
          case 'preposition':
            word.preposition = value as Preposition;
            break;
          case 'kasus':
            word.kasus = value as Kasus;
            break;
          case 'reflexive':
            word.reflexive = value.toLowerCase() === 'true';
            break;
          default:
            console.warn(`WordImportService: Unknown header: ${header}`);
        }
      });

      if (word.originalWord && word.translation && word.wordType) {
        words.push(word as Word);
      } else {
        console.warn(`WordImportService: Skipping word due to missing required fields: ${JSON.stringify(word)}`);
      }
    }
    console.log(`WordImportService: parseCsv finished. Parsed ${words.length} words.`);
    return words;
  }
}