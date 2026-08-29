package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/organizations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizationController {
    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrganizationDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(organizationService.getAllOrganizations(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getOrganizationById(id));
    }

    @PostMapping
    public ResponseEntity<OrganizationDTO> create(@RequestBody OrganizationDTO dto) {
        return ResponseEntity.ok(organizationService.createOrganization(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizationDTO> update(@PathVariable Long id, @RequestBody OrganizationDTO dto) {
        return ResponseEntity.ok(organizationService.updateOrganization(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.ok().build();
    }
}
