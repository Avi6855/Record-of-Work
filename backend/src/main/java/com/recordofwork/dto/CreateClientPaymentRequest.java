package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateClientPaymentRequest {
    @NotNull private Long clientId;
    @NotNull private Long projectId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate paymentDate;
    private String paymentMethod = "CASH";
    private String referenceNumber;
    private String description;
    private String notes;
}