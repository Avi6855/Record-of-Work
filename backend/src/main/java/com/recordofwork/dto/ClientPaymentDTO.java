package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ClientPaymentDTO {
    private Long id;
    private Long clientId;
    private String clientName;
    private Long projectId;
    private String projectName;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String referenceNumber;
    private String description;
    private String notes;
    private Boolean isVoided;
    private LocalDateTime createdAt;
}