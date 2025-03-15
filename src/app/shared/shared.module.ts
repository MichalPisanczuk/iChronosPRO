// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimerWidgetComponent } from './components/timer-widget/timer-widget.component';

@NgModule({
  declarations: [TimerWidgetComponent],
  imports: [CommonModule, RouterModule],
  exports: [TimerWidgetComponent],
})
export class SharedModule {}
