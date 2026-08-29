package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.MonthlySettlementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/monthly-settlements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MonthlySettlementController {
    private final MonthlySettlementService settlementService;
    private final AuthService authService;

    public MonthlySettlementController(MonthlySettlementService settlementService, AuthService authService) {
        this.settlementService = settlementService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<MonthlySettlementDTO>> getMonthlySettlements(
            @RequestParam int year, @RequestParam int month) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(settlementService.getMonthlySettlements(user.getOrganization().getId(), year, month));
    }

    @PostMapping("/generate")
    public ResponseEntity<MonthlySettlementDTO> generateSettlement(
            @RequestParam Long workerId, @RequestParam int year, @RequestParam int month) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(settlementService.generateSettlement(user.getOrganization().getId(), workerId, year, month));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveSettlement(@PathVariable Long id) {
        User user = authService.getCurrentUser();
        settlementService.approveSettlement(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
