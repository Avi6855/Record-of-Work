package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MonthlySettlementDTO {
    private Long id;
    private Long workerId;
    private String workerName;
    private Integer settlementMonth;
    private Integer settlementYear;
    private Integer presentDays;
    private Integer halfDays;
    private Integer absentDays;
    private BigDecimal overtimeHours;
    private BigDecimal grossWage;
    private BigDecimal totalAdvance;
    private BigDecimal totalPayment;
    private BigDecimal remainingBalance;
    private BigDecimal bonus;
    private BigDecimal deduction;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
}