import { Injectable } from '@angular/core';
import { Word, WordType, Kasus, ArticleType, Preposition } from '../models/word.model';
import { WordStorageService } from './word-storage.service';
import { QuizSession, QuizWord, QuizResults } from '../models/quiz.model';
import { WordListStorageService } from './word-list-storage.service';
import { WordList } from '../models/word-list.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  session: QuizSession | null = null;

  constructor(
    private wordStorageService: WordStorageService,
    private wordListStorageService: WordListStorageService
  ) { }

  initializeQuiz(wordCount = 10, listId?: string): boolean {
    let wordsToQuizFrom: Word[] = [];
    if (listId) {
      const selectedList = this.wordListStorageService.getWordLists().find((list: WordList) => list.id === listId);
      if (selectedList) {
        wordsToQuizFrom = this.wordStorageService.getWords().filter((word: Word) => selectedList.wordIds.includes(word.originalWord)); 
      } else {
        console.warn(`Word list with ID ${listId} not found. Using all words for quiz.`);
        wordsToQuizFrom = this.wordStorageService.getWords();
      }
    } else {
      wordsToQuizFrom = this.wordStorageService.getWords();
    }

    // Filter out verbs where kasus is 'None'
    wordsToQuizFrom = wordsToQuizFrom.filter(word => {
      return !(word.wordType === WordType.Verb && word.kasus === Kasus.None);
    });

    if (wordsToQuizFrom.length < 4) {
      return false;
    }

    const wordsForQuiz = this.shuffleArray(wordsToQuizFrom).slice(0, wordCount);
    this.session = {
      words: wordsForQuiz.map((w: Word) => {
        const isReverse = (w.learnStatus || 0) >= 2; // Levels 0-2: original word shown, guess translation. Levels 3-7: translation shown, guess original word/parts.
        let correctAnswer: string;
        let distractors: string[];
        let options: string[];
        let quizWord: QuizWord;

        if (!isReverse) { // Levels 0-2: original word shown, guess translation
          correctAnswer = w.translation;
          distractors = this.generateDistractors(correctAnswer, wordsToQuizFrom, 'translation');
          options = this.shuffleArray([correctAnswer, ...distractors]);
          quizWord = { ...w, answer: null, selected: null, isReverse: isReverse, options: options, correctAnswerDisplay: correctAnswer };
        } else { // Levels 3-7: translation shown, guess original word/parts
          
          
          correctAnswer = w.originalWord;
          distractors = this.generateDistractors(correctAnswer, wordsToQuizFrom, 'originalWord');
          options = this.shuffleArray([correctAnswer, ...distractors]);
          quizWord = { ...w, answer: null, selected: null, isReverse: isReverse, options: options, correctAnswerDisplay: correctAnswer };

          if (w.wordType === WordType.Noun) {
            quizWord.correctArticle = w.article;
            quizWord.selectedArticle = null;
          } else if (w.wordType === WordType.Verb) {
            quizWord.correctPreposition = w.preposition;
            quizWord.selectedPreposition = null;
            quizWord.prepositionOptions = this.generatePrepositionOptions(w.preposition);

            quizWord.correctKasus = w.kasus;
            quizWord.selectedKasus = null;
            quizWord.kasusOptions = this.generateKasusOptions(w.kasus);

            // For verbs at levels 3-7, hide the preposition if it exists
            if (w.preposition) {
              quizWord.hiddenPart = 'preposition';
            }
          }
        }
        console.log('Quiz Word:', quizWord); // Add this line
        return quizWord;
      }),
      currentIndex: 0,
      score: 0,
      totalQuestions: wordsForQuiz.length,
      startTime: new Date(),
      endTime: null
    };

    return true;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private generateDistractors(correctAnswer: string, wordPool: Word[], type: 'originalWord' | 'translation'): string[] {
    const distractors: string[] = [];
    const pool = this.shuffleArray(wordPool.filter((w: Word) => w[type] !== correctAnswer));
    while (distractors.length < 3 && pool.length > 0) {
        const distractor = pool.pop();
        if(distractor) {
            distractors.push(distractor[type]);
        }
    }
    return distractors;
  }

  private generatePrepositionOptions(correctPreposition?: Preposition): Preposition[] {
    const commonPrepositions = Object.values(Preposition);
    let options = correctPreposition ? [correctPreposition] : [];
    const filtered = commonPrepositions.filter(p => p !== correctPreposition);
    while (options.length < 4 && filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      options.push(filtered.splice(randomIndex, 1)[0]);
    }
    return this.shuffleArray(options);
  }

  private generateKasusOptions(correctKasus?: Kasus): Kasus[] {
    const allKasus = [Kasus.Nominativ, Kasus.Akkusativ, Kasus.Dativ, Kasus.Genitiv, Kasus.None];
    let options = correctKasus ? [correctKasus] : [];
    const filtered = allKasus.filter(k => k !== correctKasus);
    while (options.length < 4 && filtered.length > 0) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      options.push(filtered.splice(randomIndex, 1)[0]);
    }
    return this.shuffleArray(options);
  }

  handleAnswer(selectedOption: string, selectedArticle?: ArticleType, selectedPreposition?: Preposition, selectedKasus?: Kasus): void {
    if (!this.session) return;

    const currentWord = this.session.words[this.session.currentIndex];
    currentWord.selected = selectedOption;
    currentWord.selectedArticle = selectedArticle || null;
    currentWord.selectedPreposition = selectedPreposition || null;
    currentWord.selectedKasus = selectedKasus || null;

    let isCorrectWord = false;
    let isCorrectArticle = true;
    let isCorrectPreposition = true;

    if (currentWord.isReverse) { // Levels 3-7: translation shown, guess original word/parts
      isCorrectWord = selectedOption === currentWord.originalWord;

      if (currentWord.wordType === WordType.Noun) {
        isCorrectArticle = currentWord.correctArticle === undefined || selectedArticle === currentWord.correctArticle;
        currentWord.answer = isCorrectWord && isCorrectArticle;
      } else if (currentWord.wordType === WordType.Verb) {
        if (currentWord.hiddenPart === 'preposition') {
          isCorrectPreposition = (selectedPreposition === currentWord.correctPreposition);
        }
        currentWord.answer = isCorrectWord && isCorrectPreposition;
      } else { // For other word types (Adjective, etc.)
        currentWord.answer = isCorrectWord;
      }
    } else { // Levels 0-2: original word shown, guess translation
      isCorrectWord = selectedOption === currentWord.translation;
      currentWord.answer = isCorrectWord;
    }

    // If the answer is incorrect, set correctAnswerDisplay
    if (currentWord.answer === false) {
      if (!currentWord.isReverse) {
        currentWord.correctAnswerDisplay = currentWord.translation;
      } else {
        let display = currentWord.originalWord;
        if (currentWord.wordType === WordType.Noun && currentWord.correctArticle && currentWord.correctArticle !== ArticleType.None) {
          display = `${currentWord.correctArticle} ${display}`;
        }
        if (currentWord.wordType === WordType.Verb) {
          if (currentWord.correctPreposition) {
            display = `${currentWord.correctPreposition} ${display}`;
          }
          if (currentWord.correctKasus && currentWord.correctKasus !== Kasus.None) {
            display = `${display} (${currentWord.correctKasus})`;
          }
          if (currentWord.reflexive) {
            display = `sich ${display}`;
          }
        }
        currentWord.correctAnswerDisplay = display;
      }
    }
  }

  nextCard(): void {
    if (!this.session) return;

    if (this.session.currentIndex < this.session.words.length - 1) {
      this.session.currentIndex++;
    } else {
      this.session.endTime = new Date();
    }
  }

  endQuiz(): QuizResults | null {
    if (!this.session || !this.session.endTime) return null;

    const correctAnswers = this.session.words.filter(w => w.answer);
    const incorrectAnswers = this.session.words.filter(w => !w.answer);
    const timeSpent = (this.session.endTime.getTime() - this.session.startTime.getTime()) / 1000; // in seconds

    const results: QuizResults = {
      score: correctAnswers.length,
      percentage: (correctAnswers.length / this.session.totalQuestions) * 100,
      totalQuestions: this.session.totalQuestions,
      timeSpent: timeSpent,
      correctAnswers: correctAnswers,
      incorrectAnswers: incorrectAnswers
    };

    // Update word learn statuses
    results.correctAnswers.forEach(word => {
      this.wordStorageService.updateWordLearnStatus(word.originalWord, true);
    });
    results.incorrectAnswers.forEach(word => {
      this.wordStorageService.updateWordLearnStatus(word.originalWord, false);
    });

    return results;
  }
}