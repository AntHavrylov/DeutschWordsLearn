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

  private vocabularyVersionService = inject(VocabularyVersionService);

  currentSubPage: string = 'word-list-manager'; // Default sub-page


  navigateToSubPage(subPage: string): void {
    this.currentSubPage = subPage;
  }

  syncVocabulary() {
    if(confirm(`Durch diese Aktion werden alle neuen Wörter vom Server zu Ihrem Standardwortschatz hinzugefügt. Fortfahren?`))
    this.vocabularyVersionService.getRemoteVersion().subscribe(remoteVersion => {
      if (remoteVersion !== null) {
        this.vocabularyVersionService.triggerDefaultWordsImport(remoteVersion, 'add-only');

      } else {
        console.error('Could not get remote version to trigger vocabulary update.');
      }
    });
  }

  resetAllData() {
    if (confirm(`Möchtest du wirklich alle Daten löschen?`)) {
      localStorage.clear();
    }
  }
}