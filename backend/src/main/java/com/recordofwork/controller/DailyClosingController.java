package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.DailyClosingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/daily-closing")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DailyClosingController {
    private final DailyClosingService dailyClosingService;
    private final AuthService authService;

    public DailyClosingController(DailyClosingService dailyClosingService, AuthService authService) {
        this.dailyClosingService = dailyClosingService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<DailyClosingDTO> getDailyClosing(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(dailyClosingService.getDailyClosing(user.getOrganization().getId(), date));
    }

    @PostMapping("/close")
    public ResponseEntity<DailyClosingDTO> closeDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String notes) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(dailyClosingService.closeDay(user.getOrganization().getId(), date, user.getId(), notes));
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> isDayClosed(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(dailyClosingService.isDayClosed(user.getOrganization().getId(), date));
    }
}
