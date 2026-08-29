package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_closings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "closing_date", nullable = false, unique = true)
    private LocalDate closingDate;

    @Column(name = "total_workers")
    private Integer totalWorkers = 0;

    @Column(name = "present_count")
    private Integer presentCount = 0;

    @Column(name = "absent_count")
    private Integer absentCount = 0;

    @Column(name = "half_day_count")
    private Integer halfDayCount = 0;

    @Column(name = "overtime_count")
    private Integer overtimeCount = 0;

    @Column(name = "total_wages", precision = 14, scale = 2)
    private BigDecimal totalWages = BigDecimal.ZERO;

    @Column(name = "total_advances", precision = 14, scale = 2)
    private BigDecimal totalAdvances = BigDecimal.ZERO;

    @Column(name = "total_payments", precision = 14, scale = 2)
    private BigDecimal totalPayments = BigDecimal.ZERO;

    @Column(name = "total_expenses", precision = 14, scale = 2)
    private BigDecimal totalExpenses = BigDecimal.ZERO;

    @Column(name = "total_income", precision = 14, scale = 2)
    private BigDecimal totalIncome = BigDecimal.ZERO;

    @Column(name = "opening_cash", precision = 14, scale = 2)
    private BigDecimal openingCash = BigDecimal.ZERO;

    @Column(name = "closing_cash", precision = 14, scale = 2)
    private BigDecimal closingCash = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_closed")
    private Boolean isClosed = false;

    @Column(name = "closed_by")
    private Long closedBy;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
