package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.ClientPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/client-payments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClientPaymentController {
    private final ClientPaymentService clientPaymentService;
    private final AuthService authService;

    public ClientPaymentController(ClientPaymentService clientPaymentService, AuthService authService) {
        this.clientPaymentService = clientPaymentService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClientPaymentDTO>> getAllClientPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(clientPaymentService.getAllClientPayments(user.getOrganization().getId(), page, size));
    }

    @PostMapping
    public ResponseEntity<ClientPaymentDTO> createClientPayment(@Valid @RequestBody CreateClientPaymentRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(clientPaymentService.createClientPayment(user.getOrganization().getId(), request));
    }
}
