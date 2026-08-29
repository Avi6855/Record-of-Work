package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateExpenseRequest {
    private Long projectId;
    @NotBlank private String category;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate expenseDate;
    @NotBlank private String description;
    private String vendor;
    private String vendorPhone;
    private String paymentMethod = "CASH";
    private String notes;
}