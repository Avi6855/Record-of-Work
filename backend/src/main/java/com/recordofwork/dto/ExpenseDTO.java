package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExpenseDTO {
    private Long id;
    private Long projectId;
    private String projectName;
    private String category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String description;
    private String vendor;
    private String vendorPhone;
    private String paymentMethod;
    private String receiptUrl;
    private String notes;
    private Boolean isVoided;
    private LocalDateTime createdAt;
}