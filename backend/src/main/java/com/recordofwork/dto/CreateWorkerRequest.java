package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateWorkerRequest {
    @NotBlank private String name;
    private String marathiName;
    private String phone;
    private String address;
    private String village;
    private String workType;
    private String skill;
    @NotNull @DecimalMin("0") private BigDecimal dailyWage;
    @DecimalMin("0") private BigDecimal overtimeRate;
    private LocalDate joiningDate;
    private String notes;
}