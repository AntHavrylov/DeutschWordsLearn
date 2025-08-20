import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WordImportService } from '../../core/services/word-import.service';
import { WordListStorageService } from '../../core/services/word-list-storage.service';
import { WordList } from '../../core/models/word-list.model';
import { SourceStorageService } from '../../core/services/source-storage.service';
import { Source } from '../../core/models/source.model';

@Component({
  selector: 'app-import-words',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-words.component.html',
  styleUrls: ['./import-words.component.css']
})
export class ImportWordsComponent implements OnInit {
  csvUrl: string = ''; // No longer default, will be selected
  importStatus: string = '';
  isLoading: boolean = false;

  wordLists: WordList[] = [];
  selectedListId: string = '';
  newListName: string = '';

  sources: Source[] = [];
  selectedSourceId: string = '';

  @Output() navigate = new EventEmitter<string>();

  constructor(
    private wordImportService: WordImportService,
    private wordListStorageService: WordListStorageService,
    private sourceStorageService: SourceStorageService
  ) { }

  ngOnInit(): void {
    this.loadWordLists();
    this.loadSources();
  }

  loadWordLists(): void {
    this.wordLists = this.wordListStorageService.getWordLists();
    if (this.wordLists.length > 0 && !this.selectedListId) { // Only set if not already selected
      this.selectedListId = this.wordLists[0].id; // Select the first list by default
    }
  }

  loadSources(): void {
    this.sources = this.sourceStorageService.getSources();
    if (this.sources.length > 0 && !this.selectedSourceId) { // Only set if not already selected
      this.selectedSourceId = this.sources[0].id; // Select the first source by default
    }
  }

  createAndSelectNewList(): void {
    if (this.newListName.trim()) {
      const newList: WordList = {
        id: '', // Service will generate
        name: this.newListName.trim(),
        wordIds: []
      };
      this.wordListStorageService.saveWordList(newList);
      this.newListName = '';
      this.loadWordLists();
      this.selectedListId = newList.id; // Select the newly created list
    }
  }

  importWords(): void {
    let urlToImport = '';
    if (this.selectedSourceId) {
      const selectedSource = this.sources.find(s => s.id === this.selectedSourceId);
      if (selectedSource) {
        urlToImport = selectedSource.url;
      }
    } else {
      this.importStatus = 'Bitte wählen Sie eine Quelle aus oder geben Sie eine Google Sheets CSV URL ein.';
      return;
    }

    if (!urlToImport) {
      this.importStatus = 'Ausgewählte Quelle hat keine URL.';
      return;
    }

    this.isLoading = true;
    this.importStatus = 'Wörter importieren...';

    this.wordImportService.importWords(urlToImport, this.selectedListId).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.importStatus = `Erfolgreich ${result.importedCount} von ${result.totalCount} Wörtern importiert.`;
        } else {
          this.importStatus = `Import mit Fehlern abgeschlossen. ${result.importedCount} von ${result.totalCount} Wörtern importiert. Fehler: ${JSON.stringify(result.errors)}`;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.importStatus = `Fehler beim Import: ${err.message || err}`;
        console.error('Import error:', err);
      }
    });
  }

  navigateToSourceManager(): void {
    this.navigate.emit('manage-sources');
  }
}