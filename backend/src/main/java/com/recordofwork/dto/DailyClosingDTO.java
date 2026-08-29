package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class DailyClosingDTO {
    private Long id;
    private LocalDate closingDate;
    private Integer totalWorkers;
    private Integer presentCount;
    private Integer absentCount;
    private Integer halfDayCount;
    private Integer overtimeCount;
    private BigDecimal totalWages;
    private BigDecimal totalAdvances;
    private BigDecimal totalPayments;
    private BigDecimal totalExpenses;
    private BigDecimal totalIncome;
    private BigDecimal openingCash;
    private BigDecimal closingCash;
    private String notes;
    private Boolean isClosed;
    private String closedByName;
    private LocalDateTime closedAt;
}