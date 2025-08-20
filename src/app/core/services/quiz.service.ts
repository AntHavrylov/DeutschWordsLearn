import { Injectable } from '@angular/core';
import { Word, WordType, Kasus, ArticleType } from '../models/word.model';
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
        wordsToQuizFrom = this.wordStorageService.getWords().filter((word: Word) => selectedList.wordIds.includes(word.id));
      } else {
        console.warn(`Word list with ID ${listId} not found. Using all words for quiz.`);
        wordsToQuizFrom = this.wordStorageService.getWords();
      }
    } else {
      wordsToQuizFrom = this.wordStorageService.getWords();
    }

    if (wordsToQuizFrom.length < 4) {
      return false;
    }

    const wordsForQuiz = this.shuffleArray(wordsToQuizFrom).slice(0, wordCount);

    this.session = {
      words: wordsForQuiz.map((w: Word) => {
        const isReverse = (w.learnStatus || 0) >= 3;
        const correctAnswer = isReverse ? w.originalWord : w.translation;
        const distractors = this.generateDistractors(correctAnswer, this.wordStorageService.getWords(), isReverse ? 'originalWord' : 'translation');
        const options = this.shuffleArray([correctAnswer, ...distractors]);

        let quizWord: QuizWord = {
          ...w,
          answer: null,
          selected: null,
          options: options,
          isReverse: isReverse,
          correctArticle: w.article,
          selectedArticle: null,
          correctAnswerDisplay: correctAnswer
        };

        if (w.wordType === WordType.Verb) {
          quizWord.correctPreposition = w.preposition;
          quizWord.selectedPreposition = null;
          quizWord.prepositionOptions = this.generatePrepositionOptions(w.preposition);

          quizWord.correctKasus = w.kasus;
          quizWord.selectedKasus = null;
          quizWord.kasusOptions = this.generateKasusOptions(w.kasus);
        }
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

  private generatePrepositionOptions(correctPreposition?: string): string[] {
    const commonPrepositions = ['mit', 'nach', 'auf', 'von', 'in', 'an', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen', 'durch', 'für', 'gegen', 'ohne', 'um', 'aus', 'bei', 'gegenüber', 'seit', 'zu', 'entlang'];
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

  handleAnswer(selectedOption: string, selectedArticle?: ArticleType, selectedPreposition?: string, selectedKasus?: Kasus): void {
    if (!this.session) return;

    const currentWord = this.session.words[this.session.currentIndex];
    currentWord.selected = selectedOption;
    currentWord.selectedArticle = selectedArticle || null;
    currentWord.selectedPreposition = selectedPreposition || null;
    currentWord.selectedKasus = selectedKasus || null;

    let isCorrectWord = false;
    let isCorrectArticle = true;
    let isCorrectPreposition = true;
    let isCorrectKasus = true;

    if (currentWord.isReverse) {
      isCorrectWord = selectedOption === currentWord.originalWord;
      isCorrectArticle = currentWord.correctArticle === undefined || selectedArticle === currentWord.correctArticle;

      if (currentWord.wordType === WordType.Verb) {
        isCorrectPreposition = currentWord.correctPreposition === undefined || selectedPreposition === currentWord.correctPreposition;
        isCorrectKasus = currentWord.correctKasus === undefined || selectedKasus === currentWord.correctKasus;
      }
      currentWord.answer = isCorrectWord && isCorrectArticle && isCorrectPreposition && isCorrectKasus;
    } else {
      isCorrectWord = selectedOption === currentWord.translation;
      currentWord.answer = isCorrectWord;
    }

    // If the answer is incorrect, set correctAnswerDisplay
    if (currentWord.answer === false) {
      currentWord.correctAnswerDisplay = currentWord.isReverse ? currentWord.originalWord : currentWord.translation;
      // Optionally, add article/preposition/kasus to the display string if needed
      if (currentWord.isReverse && currentWord.correctArticle && currentWord.correctArticle !== ArticleType.None) {
        currentWord.correctAnswerDisplay = `${currentWord.correctArticle} ${currentWord.correctAnswerDisplay}`;
      }
      if (currentWord.isReverse && currentWord.wordType === WordType.Verb) {
        if (currentWord.correctPreposition) {
          currentWord.correctAnswerDisplay = `${currentWord.correctPreposition} ${currentWord.correctAnswerDisplay}`;
        }
        if (currentWord.correctKasus && currentWord.correctKasus !== Kasus.None) {
          currentWord.correctAnswerDisplay = `${currentWord.correctAnswerDisplay} (${currentWord.correctKasus})`;
        }
        if (currentWord.reflexive) {
          currentWord.correctAnswerDisplay = `sich ${currentWord.correctAnswerDisplay}`;
        }
      }
    }
  }

  nextCard(): void {
    if (!this.session) return;
    if (this.session.currentIndex < this.session.totalQuestions - 1) {
      this.session.currentIndex++;
    } else {
      this.endQuiz();
    }
  }

  previousCard(): void {
    if (!this.session) return;
    if (this.session.currentIndex > 0) {
      this.session.currentIndex--;
    }
  }

  endQuiz(): QuizResults | null {
    if (!this.session) return null;

    this.session.endTime = new Date();
    const correctAnswers = this.session.words.filter(w => w.answer === true);
    const incorrectAnswers = this.session.words.filter(w => w.answer === false);
    const score = correctAnswers.length;
    const percentage = this.calculateScore(score, this.session.totalQuestions);
    const timeSpent = (this.session.endTime.getTime() - this.session.startTime.getTime()) / 1000;

    // Update learnStatus
    const allWords = this.wordStorageService.getWords();
    correctAnswers.forEach(answeredWord => {
      const wordToUpdate = allWords.find(w => w.id === answeredWord.id);
      if (wordToUpdate) {
        wordToUpdate.learnStatus = Math.min(7, (wordToUpdate.learnStatus || 0) + 1);
      }
    });
    incorrectAnswers.forEach(answeredWord => {
      const wordToUpdate = allWords.find(w => w.id === answeredWord.id);
      if (wordToUpdate) {
        wordToUpdate.learnStatus = Math.max(0, (wordToUpdate.learnStatus || 0) - 1);
      }
    });
    this.wordStorageService.clearAllWords();
    allWords.forEach(w => this.wordStorageService.saveWord(w));

    const results: QuizResults = {
      score,
      percentage,
      totalQuestions: this.session.totalQuestions,
      timeSpent,
      correctAnswers,
      incorrectAnswers
    };

    return results;
  }

  private calculateScore(correct: number, total: number): number {
    if (total === 0) return 0;
    return parseFloat(((correct / total) * 100).toFixed(2));
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}