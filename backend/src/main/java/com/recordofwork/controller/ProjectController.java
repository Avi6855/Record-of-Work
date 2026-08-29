package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {
    private final ProjectService projectService;
    private final AuthService authService;

    public ProjectController(ProjectService projectService, AuthService authService) {
        this.projectService = projectService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProjectDTO>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(projectService.getAllProjects(user.getOrganization().getId(), page, size, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody CreateProjectRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(projectService.createProject(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateProjectStatus(@PathVariable Long id, @RequestParam String status) {
        projectService.updateProjectStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/workers")
    public ResponseEntity<Void> assignWorkers(@PathVariable Long id, @RequestBody Set<Long> workerIds) {
        projectService.assignWorkers(id, workerIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<ProjectDTO>> getWorkerProjects(@PathVariable Long workerId) {
        return ResponseEntity.ok(projectService.getWorkerProjects(workerId));
    }
}
