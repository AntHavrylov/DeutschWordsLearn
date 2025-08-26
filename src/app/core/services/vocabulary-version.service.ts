
import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const VOCABULARY_VERSION_KEY = 'vocabulary_version';
const REMOTE_VERSION_URL = 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/refs/heads/main/version.json';

@Injectable({
  providedIn: 'root'
})
export class VocabularyVersionService {

  public isUpdateModalVisible: WritableSignal<boolean> = signal(false);
  
  constructor(private http: HttpClient) { }

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
