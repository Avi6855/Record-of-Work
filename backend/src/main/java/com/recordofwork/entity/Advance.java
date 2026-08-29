package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "advances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Advance {

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
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "advance_date", nullable = false)
    private LocalDate advanceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(name = "reason")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_settled")
    private Boolean isSettled = false;

    @Column(name = "settled_amount", precision = 12, scale = 2)
    private BigDecimal settledAmount = BigDecimal.ZERO;

    @Column(name = "is_voided")
    private Boolean isVoided = false;

    @Column(name = "voided_by")
    private Long voidedBy;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "void_reason")
    private String voidReason;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum PaymentMethod {
        CASH, UPI, BANK_TRANSFER, CHEQUE
    }
}
