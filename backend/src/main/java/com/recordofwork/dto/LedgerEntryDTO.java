package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LedgerEntryDTO {
    private Long id;
    private LocalDate entryDate;
    private String entryType;
    private String description;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal balance;
    private String referenceType;
    private Long referenceId;
    private Boolean isVoided;
}
