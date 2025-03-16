// src/app/features/reports/reports.component.ts
import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../core/services/client.service';
import { ProjectService } from '../../core/services/project.service';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { Client } from '../../core/models/client.model';
import { Project } from '../../core/models/project.model';

// Interfejsy dla danych raportów
interface TimeEntryReportItem {
  date: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  taskCount: number;
}

interface ProjectReportItem {
  id: number;
  name: string;
  clientName: string;
  status: string;
  hours: number;
  budget: number;
  progress: number;
}

interface ClientReportItem {
  id: number;
  name: string;
  isActive: boolean;
  projectCount: number;
  hours: number;
  income: number;
  averageRate: number;
}

interface EarningReportItem {
  period: string;
  hours: number;
  income: number;
  averageRate: number;
}

// Interfejsy dla podsumowań
interface ProjectSummary {
  totalCount: number;
  activeCount: number;
  totalHours: number;
  totalBudget: number;
}

interface ClientSummary {
  totalCount: number;
  activeCount: number;
  projectCount: number;
  totalIncome: number;
}

interface EarningSummary {
  totalIncome: number;
  billableHours: number;
  averageRate: number;
  averageDailyIncome: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  // Aktywna zakładka
  currentTab = 'time';

  // Wspólne filtry
  dateRange = 'thisMonth';
  startDate = '';
  endDate = '';

  // Filtry specyficzne dla zakładek
  timeGroupBy = 'daily';
  billableFilter = 'all';
  projectFilter = 'all';
  projectStatusFilter = 'all';
  clientFilter = 'all';
  clientStatusFilter = 'all';
  earningsGroupBy = 'weekly';
  minAmount = 0;

  // Dane raportów
  timeEntryReportData: TimeEntryReportItem[] = [];
  projectReportData: ProjectReportItem[] = [];
  clientReportData: ClientReportItem[] = [];
  earningReportData: EarningReportItem[] = [];

  // Podsumowania
  totalHours = 0;
  billableHours = 0;
  nonBillableHours = 0;
  billablePercentage = 0;

  projectSummary: ProjectSummary = {
    totalCount: 0,
    activeCount: 0,
    totalHours: 0,
    totalBudget: 0,
  };

  clientSummary: ClientSummary = {
    totalCount: 0,
    activeCount: 0,
    projectCount: 0,
    totalIncome: 0,
  };

  earningSummary: EarningSummary = {
    totalIncome: 0,
    billableHours: 0,
    averageRate: 0,
    averageDailyIncome: 0,
  };

  // Dostępne dane
  clients: Client[] = [];
  projects: Project[] = [];

  // UI state
  isLoading = false;
  errorMessage = '';

  constructor(
    private clientService: ClientService,
    private projectService: ProjectService,
    private timeEntryService: TimeEntryService
  ) {
    // Inicjalizuj daty
    const today = new Date();
    this.endDate = this.formatDateForInput(today);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDateForInput(startOfMonth);
  }

  ngOnInit(): void {
    // Ładuj dane pomocnicze
    this.loadClients();
    this.loadProjects();

    // Załaduj domyślny raport
    this.refreshReport();
  }

  // Zmiana zakładki
  switchTab(tab: string): void {
    this.currentTab = tab;
    this.refreshReport();
  }

  // Odświeżenie raportu
  refreshReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Symulacja opóźnienia API
    setTimeout(() => {
      try {
        switch (this.currentTab) {
          case 'time':
            this.generateTimeReport();
            break;
          case 'projects':
            this.generateProjectReport();
            break;
          case 'clients':
            this.generateClientReport();
            break;
          case 'earnings':
            this.generateEarningReport();
            break;
        }
        this.isLoading = false;
      } catch (error) {
        this.errorMessage = 'Wystąpił błąd podczas generowania raportu.';
        this.isLoading = false;
      }
    }, 1000);
  }

  // Aktualizacja filtra dat
  updateDateRangeFilter(): void {
    const today = new Date();
    let start = new Date();

    switch (this.dateRange) {
      case 'today':
        start = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        break;
      case 'thisWeek':
        start = new Date(today);
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'lastWeek':
        start = new Date(today);
        start.setDate(start.getDate() - start.getDay() - 7);
        const endLastWeek = new Date(start);
        endLastWeek.setDate(endLastWeek.getDate() + 6);
        this.endDate = this.formatDateForInput(endLastWeek);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        this.endDate = this.formatDateForInput(endLastMonth);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        // Używamy już ustawionych dat
        this.applyFilters();
        return;
    }

    this.startDate = this.formatDateForInput(start);

    if (this.dateRange !== 'lastWeek' && this.dateRange !== 'lastMonth') {
      this.endDate = this.formatDateForInput(today);
    }

    this.applyFilters();
  }

  // Formatowanie daty do formatu YYYY-MM-DD dla inputów
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Resetowanie wszystkich filtrów
  clearFilters(): void {
    this.dateRange = 'thisMonth';
    this.timeGroupBy = 'daily';
    this.billableFilter = 'all';
    this.projectFilter = 'all';
    this.projectStatusFilter = 'all';
    this.clientFilter = 'all';
    this.clientStatusFilter = 'all';
    this.earningsGroupBy = 'weekly';
    this.minAmount = 0;

    // Aktualizacja dat
    const today = new Date();
    this.endDate = this.formatDateForInput(today);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDateForInput(startOfMonth);

    this.applyFilters();
  }

  // Zastosowanie filtrów i odświeżenie raportu
  applyFilters(): void {
    this.refreshReport();
  }

  // Tytuł raportu
  getReportTitle(): string {
    let title = '';

    switch (this.currentTab) {
      case 'time':
        title = 'Raport czasu pracy';
        break;
      case 'projects':
        title = 'Raport projektów';
        break;
      case 'clients':
        title = 'Raport klientów';
        break;
      case 'earnings':
        title = 'Raport zarobków';
        break;
    }

    // Dodaj zakres dat
    if (this.dateRange === 'custom') {
      title += ` (${this.startDate} - ${this.endDate})`;
    } else {
      const dateRangeLabels: { [key: string]: string } = {
        today: 'Dzisiaj',
        yesterday: 'Wczoraj',
        thisWeek: 'Ten tydzień',
        lastWeek: 'Poprzedni tydzień',
        thisMonth: 'Ten miesiąc',
        lastMonth: 'Poprzedni miesiąc',
        thisYear: 'Ten rok',
      };

      title += ` (${dateRangeLabels[this.dateRange]})`;
    }

    return title;
  }

  // Ładowanie pomocniczych danych
  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Błąd przy ładowaniu klientów:', error);
      },
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Błąd przy ładowaniu projektów:', error);
      },
    });
  }

  // Generowanie raportów
  generateTimeReport(): void {
    // Symulacja danych raportu czasu
    const daysCount = 7; // Ilość dni do pokazania
    const entries: TimeEntryReportItem[] = [];

    let totalHoursSum = 0;
    let billableHoursSum = 0;
    let nonBillableHoursSum = 0;

    for (let i = 0; i < daysCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const totalHours = Math.random() * 8;
      const billableHours = totalHours * (Math.random() * 0.4 + 0.6); // 60-100% czasu billable
      const nonBillableHours = totalHours - billableHours;

      totalHoursSum += totalHours;
      billableHoursSum += billableHours;
      nonBillableHoursSum += nonBillableHours;

      entries.push({
        date: date.toLocaleDateString('pl-PL', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        }),
        totalHours,
        billableHours,
        nonBillableHours,
        taskCount: Math.floor(Math.random() * 5) + 1,
      });
    }

    // Aktualizacja danych podsumowania i raportu
    this.totalHours = totalHoursSum;
    this.billableHours = billableHoursSum;
    this.nonBillableHours = nonBillableHoursSum;
    this.billablePercentage = (billableHoursSum / totalHoursSum) * 100;

    this.timeEntryReportData = entries;
  }

  generateProjectReport(): void {
    // Symulacja danych raportu projektów
    const projectCount = 5;
    const entries: ProjectReportItem[] = [];

    let totalCount = 0;
    let activeCount = 0;
    let totalHours = 0;
    let totalBudget = 0;

    const statuses = ['active', 'completed', 'paused', 'cancelled'];

    for (let i = 1; i <= projectCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hours = 20 + Math.random() * 80;
      const budget = 2000 + Math.random() * 8000;
      const progress = Math.floor(Math.random() * 100);

      totalCount++;
      if (status === 'active') activeCount++;
      totalHours += hours;
      totalBudget += budget;

      entries.push({
        id: i,
        name: `Projekt ${i}`,
        clientName: `Klient ${Math.floor(Math.random() * 3) + 1}`,
        status,
        hours,
        budget,
        progress,
      });
    }

    // Aktualizacja danych podsumowania i raportu
    this.projectSummary = {
      totalCount,
      activeCount,
      totalHours,
      totalBudget,
    };

    this.projectReportData = entries;
  }

  generateClientReport(): void {
    // Symulacja danych raportu klientów
    const clientCount = 4;
    const entries: ClientReportItem[] = [];

    let totalCount = 0;
    let activeCount = 0;
    let projectCount = 0;
    let totalIncome = 0;

    for (let i = 1; i <= clientCount; i++) {
      const isActive = Math.random() > 0.3; // 70% szansy na aktywnego klienta
      const clientProjectCount = Math.floor(Math.random() * 5) + 1;
      const hours = 40 + Math.random() * 120;
      const income = hours * (80 + Math.random() * 40);
      const averageRate = income / hours;

      totalCount++;
      if (isActive) activeCount++;
      projectCount += clientProjectCount;
      totalIncome += income;

      entries.push({
        id: i,
        name: `Klient ${i}`,
        isActive,
        projectCount: clientProjectCount,
        hours,
        income,
        averageRate,
      });
    }

    // Aktualizacja danych podsumowania i raportu
    this.clientSummary = {
      totalCount,
      activeCount,
      projectCount,
      totalIncome,
    };

    this.clientReportData = entries;
  }

  generateEarningReport(): void {
    // Symulacja danych raportu zarobków
    const periodCount = 6; // Ilość okresów do pokazania
    const entries: EarningReportItem[] = [];

    let totalIncome = 0;
    let totalHours = 0;

    for (let i = 0; i < periodCount; i++) {
      let period;

      switch (this.earningsGroupBy) {
        case 'daily':
          const date = new Date();
          date.setDate(date.getDate() - i);
          period = date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
          });
          break;
        case 'weekly':
          period = `Tydzień ${periodCount - i}`;
          break;
        case 'monthly':
          const now = new Date();
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          period = month.toLocaleDateString('pl-PL', {
            month: 'long',
            year: 'numeric',
          });
          break;
        default:
          period = `Okres ${i + 1}`;
      }

      const hours = 10 + Math.random() * 30;
      const averageRate = 80 + Math.random() * 40;
      const income = hours * averageRate;

      totalIncome += income;
      totalHours += hours;

      entries.push({
        period,
        hours,
        income,
        averageRate,
      });
    }

    // Sortuj wyniki od najnowszego do najstarszego
    entries.reverse();

    // Aktualizacja danych podsumowania i raportu
    this.earningSummary = {
      totalIncome,
      billableHours: totalHours,
      averageRate: totalIncome / totalHours,
      averageDailyIncome: totalIncome / periodCount,
    };

    this.earningReportData = entries;
  }

  // Pomocnik do formatowania statusu
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Aktywny';
      case 'paused':
        return 'Wstrzymany';
      case 'completed':
        return 'Zakończony';
      case 'cancelled':
        return 'Anulowany';
      default:
        return 'Nieznany';
    }
  }

  // Eksport raportu
  exportTo(format: 'pdf' | 'excel' | 'csv'): void {
    // W rzeczywistej implementacji, wywołalibyśmy odpowiedni serwis do eksportu
    // Na potrzeby demo wyświetlamy komunikat
    const reportType = this.getReportTitle();
    alert(
      `Eksportowanie raportu "${reportType}" do formatu ${format.toUpperCase()} zostanie zaimplementowane w przyszłości.`
    );
  }
}
