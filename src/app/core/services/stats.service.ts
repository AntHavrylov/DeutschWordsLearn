import { Injectable } from '@angular/core';
import { AppStats, SessionHistory, WordStats } from '../models/stats.model';
import { QuizResults } from '../models/quiz.model';
import { WordStorageService } from './word-storage.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly STATS_STORAGE_KEY = 'wordLearnStats';

  defaultStats: AppStats = {
    totalWords: 0,
    quizzesTaken: 0,
    averageScore: 0,
    totalPercentageSum: 0,
    studyTime: 0,
    wordStats: {},
    sessionHistory: []
  };

  constructor(private wordStorageService: WordStorageService) { }

  getStats(): AppStats {
    const stats = localStorage.getItem(this.STATS_STORAGE_KEY);
    return stats ? JSON.parse(stats) : this.defaultStats;
  }

  saveStats(stats: AppStats): void {
    localStorage.setItem(this.STATS_STORAGE_KEY, JSON.stringify(stats));
  }

  updateStats(quizResults: QuizResults): void {
    const stats = this.getStats();

    stats.quizzesTaken++;
    stats.studyTime += quizResults.timeSpent;
    stats.totalWords = this.wordStorageService.getWords().length;

    stats.totalPercentageSum += parseFloat(quizResults.percentage.toFixed(2));
    stats.averageScore = stats.totalPercentageSum / stats.quizzesTaken;

    quizResults.correctAnswers.forEach(word => {
      if (!stats.wordStats[word.originalWord]) {
        stats.wordStats[word.originalWord] = { correct: 0, incorrect: 0 };
      }
      stats.wordStats[word.originalWord].correct++;
    });
    quizResults.incorrectAnswers.forEach(word => {
      if (!stats.wordStats[word.originalWord]) {
        stats.wordStats[word.originalWord] = { correct: 0, incorrect: 0 };
      }
      stats.wordStats[word.originalWord].incorrect++;
    });

    stats.sessionHistory.push({
      date: new Date().toISOString(),
      score: quizResults.score,
      total: quizResults.totalQuestions,
      percentage: quizResults.percentage,
      timeSpent: quizResults.timeSpent
    });

    if (stats.sessionHistory.length > 20) {
      stats.sessionHistory.shift();
    }

    this.saveStats(stats);
  }

  resetStats(): boolean {
    if (confirm('Sind Sie sicher, dass Sie alle Statistiken zurücksetzen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      localStorage.removeItem(this.STATS_STORAGE_KEY);
      return true;
    }
    return false;
  }

  getMostDifficultWords(): string[] {
    const stats = this.getStats();
    return Object.entries(stats.wordStats)
      .sort(([, a], [, b]) => (b.incorrect / (b.correct + b.incorrect)) - (a.incorrect / (a.correct + a.incorrect)))
      .slice(0, 5)
      .map(([word]) => word);
  }
}