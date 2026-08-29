package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class WorkerDTO {
    private Long id;
    private String name;
    private String marathiName;
    private String phone;
    private String address;
    private String village;
    private String workType;
    private String skill;
    private BigDecimal dailyWage;
    private BigDecimal overtimeRate;
    private LocalDate joiningDate;
    private String photoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String notes;
    private Boolean isActive;
    private Long organizationId;
    private Long userId;
    private BigDecimal totalAdvance;
    private BigDecimal totalPayment;
    private BigDecimal outstandingBalance;
    private Integer presentDays;
    private LocalDateTime createdAt;
}