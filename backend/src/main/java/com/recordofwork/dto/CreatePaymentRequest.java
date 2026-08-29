package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreatePaymentRequest {
    @NotNull private Long workerId;
    private Long projectId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate paymentDate;
    private String paymentMethod = "CASH";
    @NotBlank private String paymentType;
    private String description;
    private String notes;
    private String referenceNumber;
}