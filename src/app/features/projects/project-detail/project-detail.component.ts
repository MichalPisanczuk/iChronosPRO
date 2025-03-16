// src/app/features/projects/project-detail/project-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  projectId!: number;
  project: Project | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.projectId = +params['id'];
      this.loadProject();
    });
  }

  loadProject(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.message || 'Nie udało się załadować danych projektu';
        this.isLoading = false;
      },
    });
  }
}
