package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LedgerService {
    private final LedgerEntryRepository ledgerEntryRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;
    private final ClientPaymentRepository clientPaymentRepository;
    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final AdvanceRepository advanceRepository;

    public LedgerService(LedgerEntryRepository ledgerEntryRepository, WorkerRepository workerRepository,
                         ProjectRepository projectRepository, ClientPaymentRepository clientPaymentRepository,
                         ExpenseRepository expenseRepository, PaymentRepository paymentRepository,
                         AdvanceRepository advanceRepository) {
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.advanceRepository = advanceRepository;
    }

    public LedgerDTO getWorkerLedger(Long workerId) {
        Worker worker = workerRepository.findById(workerId).orElseThrow();
        List<LedgerEntry> entries = ledgerEntryRepository.findWorkerLedger(workerId);
        LedgerDTO dto = new LedgerDTO();
        dto.setEntityId(workerId);
        dto.setEntityName(worker.getName());
        dto.setEntityType("WORKER");
        dto.setEntries(entries.stream().map(this::toEntryDTO).toList());
        BigDecimal totalDebit = entries.stream().map(LedgerEntry::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = entries.stream().map(LedgerEntry::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalDebit(totalDebit);
        dto.setTotalCredit(totalCredit);
        BigDecimal balance = advanceRepository.sumAdvancesByWorker(workerId).subtract(paymentRepository.sumPaymentsByWorker(workerId));
        dto.setCurrentBalance(balance);
        return dto;
    }

    public LedgerDTO getProjectLedger(Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        List<LedgerEntry> entries = ledgerEntryRepository.findProjectLedger(projectId);
        LedgerDTO dto = new LedgerDTO();
        dto.setEntityId(projectId);
        dto.setEntityName(project.getName());
        dto.setEntityType("PROJECT");
        dto.setEntries(entries.stream().map(this::toEntryDTO).toList());
        BigDecimal totalExpense = expenseRepository.sumExpensesByProject(projectId);
        BigDecimal totalClientPayment = clientPaymentRepository.sumByProject(projectId);
        dto.setTotalDebit(totalExpense);
        dto.setTotalCredit(totalClientPayment);
        dto.setCurrentBalance(totalClientPayment.subtract(totalExpense));
        return dto;
    }

    public BigDecimal getCashBalance(Long orgId) {
        BigDecimal totalClientPayments = clientPaymentRepository.sumAllByOrganization(orgId);
        BigDecimal totalWorkerPayments = paymentRepository.sumAllByOrganization(orgId).negate();
        BigDecimal totalExpenses = expenseRepository.sumAllByOrganization(orgId).negate();
        return totalClientPayments.add(totalWorkerPayments).add(totalExpenses);
    }

    private LedgerEntryDTO toEntryDTO(LedgerEntry entry) {
        LedgerEntryDTO dto = new LedgerEntryDTO();
        dto.setId(entry.getId());
        dto.setEntryDate(entry.getEntryDate());
        dto.setEntryType(entry.getEntryType().name());
        dto.setDescription(entry.getDescription());
        dto.setDebit(entry.getDebit());
        dto.setCredit(entry.getCredit());
        dto.setBalance(entry.getBalance());
        dto.setReferenceType(entry.getReferenceType() != null ? entry.getReferenceType().name() : null);
        dto.setReferenceId(entry.getReferenceId());
        dto.setIsVoided(entry.getIsVoided());
        return dto;
    }
}
