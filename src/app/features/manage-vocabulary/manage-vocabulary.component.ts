import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportWordsComponent } from '../import-words/import-words.component';
import { WordListComponent } from '../word-list/word-list.component';
import { WordListManagerComponent } from '../word-list-manager/word-list-manager.component';
import { SourceManagerComponent } from '../source-manager/source-manager.component';

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
  currentSubPage: string = 'import-words'; // Default sub-page

  navigateToSubPage(subPage: string): void {
    this.currentSubPage = subPage;
  }
}