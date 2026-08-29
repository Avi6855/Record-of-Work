package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public PageResponse<NotificationDTO> getNotifications(Long userId, int page, int size) {
        Page<Notification> page1 = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void createNotification(Long orgId, Long userId, Notification.NotificationType type, String title, String message) {
        User user = userRepository.findById(userId).orElseThrow();
        Organization org = new Organization();
        org.setId(orgId);
        Notification notification = Notification.builder()
            .organization(org).user(user).type(type).title(title).message(message)
            .build();
        notificationRepository.save(notification);
    }

    private NotificationDTO toDTO(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setType(n.getType().name());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setReferenceType(n.getReferenceType());
        dto.setReferenceId(n.getReferenceId());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
