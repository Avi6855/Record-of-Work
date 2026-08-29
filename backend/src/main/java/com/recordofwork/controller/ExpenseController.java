package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expenses")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ExpenseController {
    private final ExpenseService expenseService;
    private final AuthService authService;

    public ExpenseController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ExpenseDTO>> getAllExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(expenseService.getAllExpenses(user.getOrganization().getId(), page, size));
    }

    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody CreateExpenseRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(expenseService.createExpense(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}/void")
    public ResponseEntity<Void> voidExpense(@PathVariable Long id, @RequestParam String reason) {
        User user = authService.getCurrentUser();
        expenseService.voidExpense(id, user.getId(), reason);
        return ResponseEntity.ok().build();
    }
}
