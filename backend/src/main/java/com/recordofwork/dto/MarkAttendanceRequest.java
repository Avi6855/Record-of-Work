package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MarkAttendanceRequest {
    @NotNull private Long workerId;
    @NotNull private Long projectId;
    @NotNull private LocalDate attendanceDate;
    @NotBlank private String status;
    private BigDecimal overtimeHours;
    private String notes;
}