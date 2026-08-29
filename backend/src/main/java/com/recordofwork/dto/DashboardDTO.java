package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDTO {
    private TodaySummary today;
    private OverallSummary overall;
    private List<RecentActivity> recentActivities;
    
    @Data
    public static class TodaySummary {
        private Integer totalWorkers;
        private Integer present;
        private Integer absent;
        private Integer halfDay;
        private BigDecimal todayWages;
        private BigDecimal todayAdvances;
        private BigDecimal todayPayments;
        private BigDecimal todayExpenses;
        private BigDecimal todayIncome;
        private BigDecimal closingCash;
    }
    
    @Data
    public static class OverallSummary {
        private BigDecimal amountDue;
        private BigDecimal totalAdvances;
        private BigDecimal clientPending;
        private BigDecimal projectExpenses;
        private BigDecimal totalIncome;
        private BigDecimal availableCash;
        private BigDecimal monthlyWages;
        private BigDecimal monthlyExpenses;
        private BigDecimal monthlyIncome;
        private BigDecimal estimatedProfit;
    }
    
    @Data
    public static class RecentActivity {
        private String type;
        private String description;
        private String amount;
        private String date;
    }
}