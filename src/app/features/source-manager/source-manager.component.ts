import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SourceStorageService } from '../../core/services/source-storage.service';
import { Source } from '../../core/models/source.model';

@Component({
  selector: 'app-source-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-manager.component.html',
  styleUrls: ['./source-manager.component.css']
})
export class SourceManagerComponent implements OnInit {
  sources: Source[] = [];
  newSourceName: string = '';
  newSourceUrl: string = '';
  newSourceFileLink: string = '';
  editingSource: Source | null = null;

  constructor(private sourceStorageService: SourceStorageService) { }

  ngOnInit(): void {
    this.loadSources();
  }

  loadSources(): void {
    this.sources = this.sourceStorageService.getSources();
  }

  addSource(): void {
    if (this.newSourceName.trim()) {
      const newSource: Source = {
        id: '', // Service will generate
        name: this.newSourceName.trim(),
        url: this.newSourceUrl.trim(),
        fileLink: this.newSourceFileLink.trim()
      };
      this.sourceStorageService.saveSource(newSource);
      this.newSourceName = '';
      this.newSourceUrl = '';
      this.loadSources();
    }
  }

  editSource(source: Source): void {
    this.editingSource = { ...source }; // Create a copy for editing
    this.newSourceName = source.name;
    this.newSourceUrl = source.url;
    this.newSourceFileLink = source.fileLink || '';
  }

  updateSource(): void {
    if (this.editingSource && this.newSourceName.trim()) {
      this.editingSource.name = this.newSourceName.trim();
      this.editingSource.url = this.newSourceUrl.trim();
      this.editingSource.fileLink = this.newSourceFileLink.trim();
      this.sourceStorageService.saveSource(this.editingSource);
      this.cancelEdit();
      this.loadSources();
    }
  }

  cancelEdit(): void {
    this.editingSource = null;
    this.newSourceName = '';
    this.newSourceUrl = '';
    this.newSourceFileLink = '';
  }

  deleteSource(sourceId: string): void {
    if (confirm('Are you sure you want to delete this source?')) {
      this.sourceStorageService.deleteSource(sourceId);
      this.loadSources();
    }
  }
}