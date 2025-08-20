import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule } from 'angular-google-charts';
import { StatsService } from '../../core/services/stats.service';
import { AppStats } from '../../core/models/stats.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, GoogleChartsModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  stats!: AppStats;
  mostDifficultWords: string[] = [];
  chartData: any[] = [];
  chartOptions: any;

  constructor(private statsService: StatsService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.statsService.getStats();
    this.mostDifficultWords = this.statsService.getMostDifficultWords();
    this.prepareChartData();
  }

  prepareChartData(): void {
    this.chartData = [
      ['Datum', 'Punktzahl (%)'],
      ...this.stats.sessionHistory.map(session => [new Date(session.date).toLocaleDateString(), session.percentage])
    ];

    this.chartOptions = {
      title: 'Quiz-Ergebnisverlauf',
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: { title: 'Datum' },
      vAxis: { title: 'Punktzahl (%)', minValue: 0, maxValue: 100 }
    };
  }

    resetStats(): void {
    if (confirm('Sind Sie sicher, dass Sie alle Statistiken zurücksetzen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      this.statsService.resetStats();
      this.loadStats();
    }
  }
}