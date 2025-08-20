import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Word, WordType, ArticleType, Kasus } from '../models/word.model';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {

  constructor(private http: HttpClient) { }

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
          case 'id':
            word.id = value;
            break;
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
            word.preposition = value;
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
      if (word.id && word.originalWord && word.translation && word.wordType) {
        words.push(word as Word);
      } else {
        console.warn(`Skipping word due to missing required fields: ${JSON.stringify(word)}`);
      }
    }
    return words;
  }
}