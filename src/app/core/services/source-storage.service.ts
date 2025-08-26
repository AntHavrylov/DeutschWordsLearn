import { Injectable } from '@angular/core';
import { Source } from '../models/source.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class SourceStorageService {
  private readonly SOURCES_STORAGE_KEY = 'importSources';

  constructor() { }

  getSources(): Source[] {
    try {
      const localData = localStorage.getItem(this.SOURCES_STORAGE_KEY);
      let sources: Source[] = localData ? JSON.parse(localData) : [];
      if (sources.length === 0) {
        // Initialize with default source if no sources exist1
        sources.push({
          id: uuidv4(),
          name: 'Standard',
          fileLink: 'https://docs.google.com/spreadsheets/d/1lbjxM1SVC2dn4cBLuANqiiEmar2oJN8Rbm-W6dXWHWg/edit?usp=sharing',
          url: 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/refs/heads/main/german_default%20-%20vocabulary.csv'
        });
        sources.push({
          id: uuidv4(),
          name: 'Verben',
          fileLink: 'https://docs.google.com/spreadsheets/d/1KIkyq-OmSDTvRkFEkE7Q6xcAdk5m_JyoThXJNbfNkOE/edit?usp=sharing',
          url: 'https://raw.githubusercontent.com/AntHavrylov/DeutschWordsLearn-csv/refs/heads/main/german_verbs%20-%20vocabulary.csv'
        });
        this.saveSourcesToLocalStorage(sources); // Save the default source
      }
      return sources;
    } catch (error) {
      console.error("Fehler beim Abrufen der Quellen:", error);
      return [];
    }
  }

  saveSource(source: Source): boolean {
    try {
      let sources = this.getSources();
      const index = sources.findIndex(s => s.id === source.id);

      if (index !== -1) {
        // Update existing source
        sources[index] = source;
      } else {
        // Add new source
        if (!source.id) {
          source.id = uuidv4(); // Generate ID for new sources
        }
        sources.push(source);
      }
      this.saveSourcesToLocalStorage(sources);
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern der Quelle:", error);
      return false;
    }
  }

  deleteSource(sourceId: string): boolean {
    try {
      let sources = this.getSources();
      const initialLength = sources.length;
      sources = sources.filter(s => s.id !== sourceId);
      if (sources.length < initialLength) {
        this.saveSourcesToLocalStorage(sources);
        return true;
      }
      return false; // Source not found
    } catch (error) {
      console.error("Fehler beim Löschen der Quelle:", error);
      return false;
    }
  }

  private saveSourcesToLocalStorage(sources: Source[]): void {
    try {
      localStorage.setItem(this.SOURCES_STORAGE_KEY, JSON.stringify(sources));
    } catch (error) {
      console.error("Fehler beim Speichern der Quellen im lokalen Speicher:", error);
    }
  }
}