package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AdvanceDTO {
    private Long id;
    private Long workerId;
    private String workerName;
    private Long projectId;
    private String projectName;
    private BigDecimal amount;
    private LocalDate advanceDate;
    private String paymentMethod;
    private String reason;
    private String notes;
    private Boolean isSettled;
    private BigDecimal settledAmount;
    private Boolean isVoided;
    private LocalDateTime createdAt;
}