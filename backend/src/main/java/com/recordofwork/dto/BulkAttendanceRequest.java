package com.recordofwork.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class BulkAttendanceRequest {
    @NotNull private Long projectId;
    @NotNull private LocalDate attendanceDate;
    @NotEmpty private List<WorkerAttendance> attendances;
    
    @Data
    public static class WorkerAttendance {
        @NotNull private Long workerId;
        @NotBlank private String status;
        private String notes;
    }
}