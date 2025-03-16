// src/app/features/time-tracker/time-tracker.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimeTrackerComponent } from './time-tracker.component';
import { TimeHistoryComponent } from './time-history/time-history.component';
import { TimeStatsComponent } from './time-stats/time-stats.component';

const routes: Routes = [
  { path: '', component: TimeTrackerComponent },
  { path: 'history', component: TimeHistoryComponent },
  { path: 'stats', component: TimeStatsComponent },
];

@NgModule({
  declarations: [
    TimeTrackerComponent,
    TimeHistoryComponent,
    TimeStatsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class TimeTrackerModule {}
