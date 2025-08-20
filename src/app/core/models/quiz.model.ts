import { Word, WordType, ArticleType, Kasus } from './word.model';

export interface QuizWord extends Word {
  answer: boolean | null;
  selected: string | null;
  options: string[];
  isReverse: boolean;
  correctArticle?: ArticleType;
  selectedArticle?: ArticleType | null;
  correctPreposition?: string;
  selectedPreposition?: string | null;
  correctKasus?: Kasus;
  selectedKasus?: Kasus | null;
  prepositionOptions?: string[];
  kasusOptions?: Kasus[];
  correctAnswerDisplay?: string; // Added this line
}

export interface QuizSession {
  words: QuizWord[];
  currentIndex: number;
  score: number;
  totalQuestions: number;
  startTime: Date;
  endTime: Date | null;
}

export interface QuizResults {
  score: number;
  percentage: number;
  totalQuestions: number;
  timeSpent: number;
  correctAnswers: QuizWord[];
  incorrectAnswers: QuizWord[];
}
