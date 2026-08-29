package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class ReportDTO {
    private String reportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ReportRow> rows;
    private ReportSummary summary;
    
    @Data
    public static class ReportRow {
        private Long id;
        private String label;
        private Map<String, BigDecimal> values;
    }
    
    @Data
    public static class ReportSummary {
        private BigDecimal totalWages;
        private BigDecimal totalAdvances;
        private BigDecimal totalPayments;
        private BigDecimal totalExpenses;
        private BigDecimal totalIncome;
        private BigDecimal outstanding;
        private BigDecimal netBalance;
    }
}