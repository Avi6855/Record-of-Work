package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateAdvanceRequest {
    @NotNull private Long workerId;
    private Long projectId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull private LocalDate advanceDate;
    private String paymentMethod = "CASH";
    private String reason;
    private String notes;
}