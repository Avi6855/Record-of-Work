package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.ClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clients")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClientController {
    private final ClientService clientService;
    private final AuthService authService;

    public ClientController(ClientService clientService, AuthService authService) {
        this.clientService = clientService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ClientDTO>> getAllClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(clientService.getAllClients(user.getOrganization().getId(), page, size));
    }

    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@RequestBody ClientDTO request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(clientService.createClient(user.getOrganization().getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(@PathVariable Long id, @RequestBody ClientDTO request) {
        return ResponseEntity.ok(clientService.updateClient(id, request));
    }
}
