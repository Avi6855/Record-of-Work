package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ledger_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type")
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "debit", precision = 12, scale = 2)
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(name = "credit", precision = 12, scale = 2)
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(name = "balance", precision = 12, scale = 2)
    private BigDecimal balance;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_voided")
    private Boolean isVoided = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum EntryType {
        WAGE, ADVANCE, PAYMENT, EXPENSE, CLIENT_PAYMENT, ADJUSTMENT, CLOSING, SETTLEMENT
    }

    public enum ReferenceType {
        ATTENDANCE, ADVANCE, PAYMENT, EXPENSE, CLIENT_PAYMENT, DAILY_CLOSING, MONTHLY_SETTLEMENT, MANUAL
    }
}
