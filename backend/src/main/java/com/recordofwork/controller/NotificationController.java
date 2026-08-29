package com.recordofwork.controller;

import com.recordofwork.dto.*;
import com.recordofwork.entity.User;
import com.recordofwork.service.AuthService;
import com.recordofwork.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {
    private final NotificationService notificationService;
    private final AuthService authService;

    public NotificationController(NotificationService notificationService, AuthService authService) {
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationDTO>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(notificationService.getNotifications(user.getId(), page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(user.getId()));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User user = authService.getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
