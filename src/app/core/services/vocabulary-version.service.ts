
import { Injectable, WritableSignal, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { WordImportService } from './word-import.service';
import { SourceStorageService } from './source-storage.service';
import { WordListStorageService } from './word-list-storage.service';
import { WordList } from '../models/word-list.model';
import { v4 as uuidv4 } from 'uuid';

const VOCABULARY_VERSION_KEY = 'vocabulary_version';
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/refs/heads/main/version.json';

@Injectable({
  providedIn: 'root'
})
export class VocabularyVersionService {

  public isUpdateModalVisible: WritableSignal<boolean> = signal(false);
  
  private http = inject(HttpClient);
  private wordImportService = inject(WordImportService);
  private sourceStorageService = inject(SourceStorageService);
  private wordListStorageService = inject(WordListStorageService);

  constructor() { }

  public checkVocabularyVersion(): void {
    this.getRemoteVersion().subscribe(remoteVersion => {
      const localVersion = this.getLocalVersion();
      if (remoteVersion === null) {
        console.error('Could not fetch remote vocabulary version.');
        return;
      }
      if (localVersion === null || localVersion < remoteVersion) {
        this.isUpdateModalVisible.set(true);
      }
    });
  }

  public triggerDefaultWordsImport(remoteVersion: number, updateStrategy: 'merge' | 'add-only'): void {
    console.log('triggerDefaultWordsImport called with remoteVersion:', remoteVersion);
    const defaultSources = this.sourceStorageService.getSources();
    const importObservables: Observable<any>[] = [];

    defaultSources.forEach(source => {
      let wordList = this.wordListStorageService.getWordListByName(source.name);
      if (!wordList) {
        const newWordList: WordList = {
          id: uuidv4(),
          name: source.name
        };
        this.wordListStorageService.createWordList(newWordList);
        wordList = newWordList;
      }
      importObservables.push(this.wordImportService.importWords(source.url, wordList.id, updateStrategy).pipe(
        tap(result => console.log(`Import from ${source.url} completed with result:`, result)),
        catchError(error => {
          console.error(`Error importing from ${source.url}:`, error);
          return of({ success: false, importedCount: 0, totalCount: 0, errors: [error] });
        })
      ));
    });

    forkJoin(importObservables).pipe(
      tap(() => {
        this.setLocalVersion(remoteVersion);
        this.isUpdateModalVisible.set(false);
      }),
      catchError(error => {
        console.error('Error importing default words:', error);
        return of(null);
      })
    ).subscribe();
  }

  public getRemoteVersion(): Observable<number | null> {
    return this.http.get<{ version: number }>(REMOTE_VERSION_URL).pipe(
      map(response => response.version),
      catchError(error => {
        console.error('Error fetching remote version:', error);
        return of(null);
      })
    );
  }

  public getLocalVersion(): number | null {
    const version = localStorage.getItem(VOCABULARY_VERSION_KEY);
    return version ? parseInt(version, 10) : null;
  }

  public setLocalVersion(version: number): void {
    localStorage.setItem(VOCABULARY_VERSION_KEY, version.toString());
  }
}
