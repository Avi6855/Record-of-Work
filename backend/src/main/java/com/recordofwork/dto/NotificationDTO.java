package com.recordofwork.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String referenceType;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}