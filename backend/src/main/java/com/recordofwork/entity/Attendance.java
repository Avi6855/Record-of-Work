package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"worker_id", "project_id", "attendance_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AttendanceStatus status;

    @Column(name = "overtime_hours", precision = 4, scale = 1)
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;

    @Column(name = "marked_by")
    private Long markedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_source")
    private EntrySource entrySource = EntrySource.MANUAL;

    @Column(name = "is_corrected")
    private Boolean isCorrected = false;

    @Column(name = "corrected_by")
    private Long correctedBy;

    @Column(name = "correction_reason")
    private String correctionReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AttendanceStatus {
        PRESENT, ABSENT, HALF_DAY, OVERTIME, LEAVE, HOLIDAY
    }

    public enum EntrySource {
        MANUAL, SUPERVISOR, BULK, API
    }
}
