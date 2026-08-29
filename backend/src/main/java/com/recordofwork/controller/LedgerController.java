package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.service.LedgerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ledger")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LedgerController {
    private final LedgerService ledgerService;

    public LedgerController(LedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<LedgerDTO> getWorkerLedger(@PathVariable Long workerId) {
        return ResponseEntity.ok(ledgerService.getWorkerLedger(workerId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<LedgerDTO> getProjectLedger(@PathVariable Long projectId) {
        return ResponseEntity.ok(ledgerService.getProjectLedger(projectId));
    }

    @GetMapping("/cash")
    public ResponseEntity<java.math.BigDecimal> getCashBalance() {
        // TODO: Get org from current user
        return ResponseEntity.ok(java.math.BigDecimal.ZERO);
    }
}
