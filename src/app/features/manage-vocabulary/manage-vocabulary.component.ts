import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportWordsComponent } from '../import-words/import-words.component';
import { WordListComponent } from '../word-list/word-list.component';
import { WordListManagerComponent } from '../word-list-manager/word-list-manager.component';
import { SourceManagerComponent } from '../source-manager/source-manager.component';
import { VocabularyVersionService } from '../../core/services/vocabulary-version.service';
import { debounce } from 'rxjs';

@Component({
  selector: 'app-manage-vocabulary',
  standalone: true,
  imports: [
    CommonModule,
    ImportWordsComponent,
    WordListComponent,
    WordListManagerComponent,
    SourceManagerComponent
  ],
  templateUrl: './manage-vocabulary.component.html',
  styleUrls: ['./manage-vocabulary.component.css']
})
export class ManageVocabularyComponent {

  public vocabularyVersionService = inject(VocabularyVersionService);

  currentSubPage: string = 'word-list-manager'; // Default sub-page
  

  navigateToSubPage(subPage: string): void {
    this.currentSubPage = subPage;
  }

  syncVocabulary()
  {
    this.vocabularyVersionService.getRemoteVersion().subscribe(remoteVersion => {
      if (remoteVersion !== null) {
        this.vocabularyVersionService.triggerDefaultWordsImport(remoteVersion, 'add-only');
        
      } else {
        console.error('Could not get remote version to trigger vocabulary update.');
      }
    });
  }
}