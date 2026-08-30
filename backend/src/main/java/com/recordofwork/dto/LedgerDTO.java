package com.recordofwork.dto;

import lombok.Data;
import java.math.BigDecimal;
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
