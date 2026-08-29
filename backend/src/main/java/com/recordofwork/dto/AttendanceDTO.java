package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
public class AttendanceDTO {
    private Long id;
    private Long workerId;
    private String workerName;
    private String workerMarathiName;
    private Long projectId;
    private String projectName;
    private LocalDate attendanceDate;
    private String status;
    private BigDecimal overtimeHours;
    private String notes;
    private String entrySource;
    private Boolean isCorrected;
    private String markedByName;
    
    // For notebook view
    private Map<String, String> dailyStatus;
}