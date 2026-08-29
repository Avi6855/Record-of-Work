package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class LedgerDTO {
    private Long entityId;
    private String entityName;
    private String entityType;
    private List<LedgerEntryDTO> entries;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal currentBalance;
}

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