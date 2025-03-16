// src/app/features/projects/projects.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { ProjectFormComponent } from './project-form/project-form.component';

const routes: Routes = [
  { path: '', component: ProjectListComponent },
  { path: 'new', component: ProjectFormComponent },
  { path: ':id', component: ProjectDetailComponent },
  { path: ':id/edit', component: ProjectFormComponent },
];

@NgModule({
  declarations: [
    ProjectListComponent,
    ProjectDetailComponent,
    ProjectFormComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class ProjectsModule {}
