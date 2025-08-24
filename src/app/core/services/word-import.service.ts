import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Word } from '../models/word.model';
import { GoogleSheetsService } from './google-sheets.service';
import { WordStorageService } from './word-storage.service';
import { WordListStorageService } from './word-list-storage.service'; // Added this
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class WordImportService {

  constructor(
    private googleSheetsService: GoogleSheetsService,
    private wordStorageService: WordStorageService,
    private wordListStorageService: WordListStorageService // Added this
  ) { }

  importWords(csvUrl: string, listId?: string): Observable<{ success: boolean, importedCount: number, totalCount: number, errors: any[] }> { // Added listId
    return this.googleSheetsService.importWordsFromCsv(csvUrl).pipe(
      map(wordsToImport => {
        const errors: any[] = [];
        let importedCount = 0;

        wordsToImport.forEach(word => {
          try {
            if (!word.id) {
              word.id = uuidv4();
            }
            if (listId) {
              word.listId = listId; // Assign listId to the word object
            }
            const saved = this.wordStorageService.addOrUpdateWord(word); // Capture return value
            if (saved) {
              importedCount++;
              // The word is already linked to the list via word.listId, no need to add to wordList.wordIds
              // this.wordListStorageService.addWordToWordList(listId, word.originalWord);
            }
          } catch (e) {
            errors.push({ word: word.originalWord, error: e });
          }
        });

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
}