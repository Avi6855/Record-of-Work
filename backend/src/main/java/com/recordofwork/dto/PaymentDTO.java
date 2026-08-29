package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PaymentDTO {
    private Long id;
    private Long workerId;
    private String workerName;
    private Long projectId;
    private String projectName;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String paymentType;
    private String description;
    private String notes;
    private String referenceNumber;
    private Boolean isVoided;
    private LocalDateTime createdAt;
}