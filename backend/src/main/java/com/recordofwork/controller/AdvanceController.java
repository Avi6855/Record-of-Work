package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.AdvanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/advances")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdvanceController {
    private final AdvanceService advanceService;
    private final AuthService authService;

    public AdvanceController(AdvanceService advanceService, AuthService authService) {
        this.advanceService = advanceService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdvanceDTO>> getAllAdvances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(advanceService.getAllAdvances(user.getOrganization().getId(), page, size));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<AdvanceDTO>> getWorkerAdvances(@PathVariable Long workerId) {
        return ResponseEntity.ok(advanceService.getWorkerAdvances(workerId));
    }

    @PostMapping
    public ResponseEntity<AdvanceDTO> createAdvance(@Valid @RequestBody CreateAdvanceRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(advanceService.createAdvance(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}/void")
    public ResponseEntity<Void> voidAdvance(@PathVariable Long id, @RequestParam String reason) {
        User user = authService.getCurrentUser();
        advanceService.voidAdvance(id, user.getId(), reason);
        return ResponseEntity.ok().build();
    }
}
