package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
public class CreateProjectRequest {
    @NotBlank private String name;
    private String marathiName;
    private Long clientId;
    private String clientPhone;
    private String siteAddress;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal contractAmount;
    private String description;
    private String notes;
    private Set<Long> workerIds;
}