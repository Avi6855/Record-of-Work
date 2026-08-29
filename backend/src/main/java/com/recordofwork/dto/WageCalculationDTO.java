package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WageCalculationDTO {
    private Long workerId;
    private String workerName;
    private Integer presentDays;
    private Integer halfDays;
    private Integer absentDays;
    private BigDecimal overtimeHours;
    private BigDecimal dailyWage;
    private BigDecimal overtimeRate;
    private BigDecimal presentWage;
    private BigDecimal halfDayWage;
    private BigDecimal overtimeWage;
    private BigDecimal grossWage;
    private BigDecimal totalAdvance;
    private BigDecimal totalPayment;
    private BigDecimal remainingBalance;
    private BigDecimal bonus;
    private BigDecimal deduction;
}