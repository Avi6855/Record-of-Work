package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final AdvanceRepository advanceRepository;

    public PaymentService(PaymentRepository paymentRepository, LedgerEntryRepository ledgerEntryRepository,
                          WorkerRepository workerRepository, ProjectRepository projectRepository,
                          OrganizationRepository organizationRepository, AdvanceRepository advanceRepository) {
        this.paymentRepository = paymentRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
        this.advanceRepository = advanceRepository;
    }

    public PageResponse<PaymentDTO> getAllPayments(Long orgId, int page, int size) {
        Page<Payment> page1 = paymentRepository.findByOrganizationIdAndIsVoidedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    @Transactional
    public PaymentDTO createPayment(Long orgId, CreatePaymentRequest request) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Worker worker = workerRepository.findById(request.getWorkerId()).orElseThrow();

        Payment payment = Payment.builder()
            .organization(org).worker(worker)
            .amount(request.getAmount()).paymentDate(request.getPaymentDate())
            .paymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod()))
            .paymentType(Payment.PaymentType.valueOf(request.getPaymentType()))
            .description(request.getDescription()).notes(request.getNotes())
            .referenceNumber(request.getReferenceNumber())
            .build();
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId()).orElseThrow();
            payment.setProject(project);
        }
        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal currentBalance = advanceRepository.sumAdvancesByWorker(request.getWorkerId())
            .subtract(paymentRepository.sumPaymentsByWorker(request.getWorkerId()));

        LedgerEntry ledgerEntry = LedgerEntry.builder()
            .organization(org).worker(worker).project(payment.getProject())
            .entryType(LedgerEntry.EntryType.PAYMENT)
            .referenceType(LedgerEntry.ReferenceType.PAYMENT)
            .referenceId(savedPayment.getId())
            .amount(request.getAmount())
            .debit(BigDecimal.ZERO).credit(request.getAmount())
            .balance(currentBalance)
            .entryDate(request.getPaymentDate())
            .description("Payment: " + request.getPaymentType())
            .build();
        ledgerEntryRepository.save(ledgerEntry);

        return toDTO(savedPayment);
    }

    @Transactional
    public void voidPayment(Long id, Long userId, String reason) {
        Payment payment = paymentRepository.findById(id).orElseThrow();
        payment.setIsVoided(true);
        payment.setVoidedBy(userId);
        payment.setVoidReason(reason);
        payment.setVoidedAt(java.time.LocalDateTime.now());
        paymentRepository.save(payment);
        List<LedgerEntry> entries = ledgerEntryRepository.findWorkerLedger(payment.getWorker().getId());
        for (LedgerEntry entry : entries) {
            if (entry.getReferenceType() == LedgerEntry.ReferenceType.PAYMENT && entry.getReferenceId().equals(id)) {
                entry.setIsVoided(true);
                ledgerEntryRepository.save(entry);
                break;
            }
        }
    }

    public PaymentDTO toDTO(Payment p) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(p.getId());
        dto.setWorkerId(p.getWorker().getId());
        dto.setWorkerName(p.getWorker().getName());
        dto.setAmount(p.getAmount());
        dto.setPaymentDate(p.getPaymentDate());
        dto.setPaymentMethod(p.getPaymentMethod().name());
        dto.setPaymentType(p.getPaymentType().name());
        dto.setDescription(p.getDescription());
        dto.setNotes(p.getNotes());
        dto.setReferenceNumber(p.getReferenceNumber());
        dto.setIsVoided(p.getIsVoided());
        dto.setCreatedAt(p.getCreatedAt());
        if (p.getProject() != null) {
            dto.setProjectId(p.getProject().getId());
            dto.setProjectName(p.getProject().getName());
        }
        return dto;
    }
}
