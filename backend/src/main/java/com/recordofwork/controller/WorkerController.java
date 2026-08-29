package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.WorkerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/workers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WorkerController {
    private final WorkerService workerService;
    private final AuthService authService;

    public WorkerController(WorkerService workerService, AuthService authService) {
        this.workerService = workerService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<WorkerDTO>> getAllWorkers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(workerService.getAllWorkers(user.getOrganization().getId(), page, size, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerDTO> getWorkerById(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(workerService.getWorkerById(id, user.getOrganization().getId()));
    }

    @PostMapping
    public ResponseEntity<WorkerDTO> createWorker(@Valid @RequestBody CreateWorkerRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(workerService.createWorker(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkerDTO> updateWorker(@PathVariable Long id, @Valid @RequestBody CreateWorkerRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(workerService.updateWorker(id, user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateWorker(@PathVariable Long id) {
        workerService.deactivateWorker(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activateWorker(@PathVariable Long id) {
        workerService.activateWorker(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorker(@PathVariable Long id) {
        workerService.deleteWorker(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/wage")
    public ResponseEntity<WageCalculationDTO> calculateWage(
            @PathVariable Long id,
            @RequestParam int year, @RequestParam int month) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(workerService.calculateMonthlyWage(id, year, month, user.getOrganization().getId()));
    }
}
