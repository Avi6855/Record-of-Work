package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ClientDTO {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String companyName;
    private String notes;
    private Boolean isActive;
    private BigDecimal totalReceived;
    private BigDecimal totalPending;
    private LocalDateTime createdAt;
}