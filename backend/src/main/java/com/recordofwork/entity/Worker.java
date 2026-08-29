package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "workers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "marathi_name")
    private String marathiName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "village")
    private String village;

    @Column(name = "work_type")
    private String workType;

    @Column(name = "skill")
    private String skill;

    @Column(name = "daily_wage", precision = 12, scale = 2)
    private BigDecimal dailyWage;

    @Column(name = "overtime_rate", precision = 12, scale = 2)
    private BigDecimal overtimeRate;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version;
}
