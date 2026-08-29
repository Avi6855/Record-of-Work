package com.recordofwork.controller;

import com.recordofwork.dto.DashboardDTO;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {
    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<DashboardDTO> getDashboard() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(dashboardService.getDashboard(user.getOrganization().getId()));
    }
}
