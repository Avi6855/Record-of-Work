package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PaymentController {
    private final PaymentService paymentService;
    private final AuthService authService;

    public PaymentController(PaymentService paymentService, AuthService authService) {
        this.paymentService = paymentService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<PaymentDTO>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(paymentService.getAllPayments(user.getOrganization().getId(), page, size));
    }

    @PostMapping
    public ResponseEntity<PaymentDTO> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(paymentService.createPayment(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}/void")
    public ResponseEntity<Void> voidPayment(@PathVariable Long id, @RequestParam String reason) {
        User user = authService.getCurrentUser();
        paymentService.voidPayment(id, user.getId(), reason);
        return ResponseEntity.ok().build();
    }
}
