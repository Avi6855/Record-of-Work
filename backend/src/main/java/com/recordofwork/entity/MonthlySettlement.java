package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlySettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(name = "settlement_month", nullable = false)
    private Integer settlementMonth;

    @Column(name = "settlement_year", nullable = false)
    private Integer settlementYear;

    @Column(name = "present_days")
    private Integer presentDays = 0;

    @Column(name = "half_days")
    private Integer halfDays = 0;

    @Column(name = "absent_days")
    private Integer absentDays = 0;

    @Column(name = "overtime_hours", precision = 6, scale = 1)
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "gross_wage", precision = 14, scale = 2)
    private BigDecimal grossWage = BigDecimal.ZERO;

    @Column(name = "total_advance", precision = 14, scale = 2)
    private BigDecimal totalAdvance = BigDecimal.ZERO;

    @Column(name = "total_payment", precision = 14, scale = 2)
    private BigDecimal totalPayment = BigDecimal.ZERO;

    @Column(name = "remaining_balance", precision = 14, scale = 2)
    private BigDecimal remainingBalance = BigDecimal.ZERO;

    @Column(name = "bonus", precision = 12, scale = 2)
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "deduction", precision = 12, scale = 2)
    private BigDecimal deduction = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private SettlementStatus status = SettlementStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SettlementStatus {
        DRAFT, REVIEWED, APPROVED, SETTLED
    }
}
