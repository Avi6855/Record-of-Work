package com.recordofwork.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrganizationDTO {
    private Long id;
    private String name;
    private String marathiName;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String logoUrl;
    private String currency;
    private Boolean isActive;
    private Boolean isSuspended;
    private Long userCount;
    private Long workerCount;
    private Long projectCount;
    private LocalDateTime createdAt;
}