package com.recordofwork.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "marathi_name")
    private String marathiName;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "currency", length = 3)
    private String currency = "INR";

    @Column(name = "timezone")
    private String timezone = "Asia/Kolkata";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_suspended")
    private Boolean isSuspended = false;

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
