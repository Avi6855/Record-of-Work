package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/attendance")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final AuthService authService;

    public AttendanceController(AttendanceService attendanceService, AuthService authService) {
        this.attendanceService = attendanceService;
        this.authService = authService;
    }

    @GetMapping("/daily")
    public ResponseEntity<List<AttendanceDTO>> getDailyAttendance(
            @RequestParam Long projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(attendanceService.getDailyAttendance(user.getOrganization().getId(), projectId, date));
    }

    @GetMapping("/notebook")
    public ResponseEntity<Map<String, Map<Long, String>>> getNotebookView(
            @RequestParam Long projectId,
            @RequestParam int year, @RequestParam int month) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(attendanceService.getNotebookView(user.getOrganization().getId(), projectId, year, month));
    }

    @PostMapping
    public ResponseEntity<AttendanceDTO> markAttendance(@Valid @RequestBody MarkAttendanceRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(attendanceService.markAttendance(user.getOrganization().getId(), request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<AttendanceDTO>> markBulkAttendance(@Valid @RequestBody BulkAttendanceRequest request) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(attendanceService.markBulkAttendance(user.getOrganization().getId(), request));
    }

    @PostMapping("/all-present")
    public ResponseEntity<Void> markAllPresent(@RequestParam Long projectId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        attendanceService.markAllPresent(user.getOrganization().getId(), projectId, date);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/all-absent")
    public ResponseEntity<Void> markAllAbsent(@RequestParam Long projectId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        attendanceService.markAllAbsent(user.getOrganization().getId(), projectId, date);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/copy-previous")
    public ResponseEntity<Void> copyPreviousDay(@RequestParam Long projectId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        attendanceService.copyPreviousDay(user.getOrganization().getId(), projectId, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getAttendanceSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(attendanceService.getAttendanceSummary(user.getOrganization().getId(), date));
    }
}
