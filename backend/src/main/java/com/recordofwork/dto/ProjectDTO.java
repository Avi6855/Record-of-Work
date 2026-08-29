package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectDTO {
    private Long id;
    private String name;
    private String marathiName;
    private Long clientId;
    private String clientName;
    private String clientPhone;
    private String siteAddress;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal contractAmount;
    private String description;
    private String status;
    private String notes;
    private List<WorkerDTO> workers;
    private BigDecimal totalExpense;
    private BigDecimal totalClientPayment;
    private BigDecimal pendingAmount;
    private BigDecimal estimatedProfit;
    private LocalDateTime createdAt;
}