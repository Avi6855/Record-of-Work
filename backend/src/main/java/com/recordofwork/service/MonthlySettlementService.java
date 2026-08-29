package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MonthlySettlementService {
    private final MonthlySettlementRepository settlementRepository;
    private final WorkerService workerService;
    private final WorkerRepository workerRepository;
    private final OrganizationRepository organizationRepository;

    public MonthlySettlementService(MonthlySettlementRepository settlementRepository, WorkerService workerService,
                                    WorkerRepository workerRepository, OrganizationRepository organizationRepository) {
        this.settlementRepository = settlementRepository;
        this.workerService = workerService;
        this.workerRepository = workerRepository;
        this.organizationRepository = organizationRepository;
    }

    public List<MonthlySettlementDTO> getMonthlySettlements(Long orgId, int year, int month) {
        return settlementRepository.findByMonth(orgId, year, month).stream()
            .map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public MonthlySettlementDTO generateSettlement(Long orgId, Long workerId, int year, int month) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Worker worker = workerRepository.findById(workerId).orElseThrow();
        WageCalculationDTO wage = workerService.calculateMonthlyWage(workerId, year, month, orgId);

        MonthlySettlement settlement = MonthlySettlement.builder()
            .organization(org).worker(worker)
            .settlementMonth(month).settlementYear(year)
            .presentDays(wage.getPresentDays()).halfDays(wage.getHalfDays())
            .absentDays(wage.getAbsentDays()).overtimeHours(wage.getOvertimeHours())
            .grossWage(wage.getGrossWage()).totalAdvance(wage.getTotalAdvance())
            .totalPayment(wage.getTotalPayment()).remainingBalance(wage.getRemainingBalance())
            .build();
        return toDTO(settlementRepository.save(settlement));
    }

    @Transactional
    public void approveSettlement(Long id, Long userId) {
        MonthlySettlement settlement = settlementRepository.findById(id).orElseThrow();
        settlement.setStatus(MonthlySettlement.SettlementStatus.APPROVED);
        settlement.setApprovedBy(userId);
        settlement.setApprovedAt(java.time.LocalDateTime.now());
        settlementRepository.save(settlement);
    }

    private MonthlySettlementDTO toDTO(MonthlySettlement ms) {
        MonthlySettlementDTO dto = new MonthlySettlementDTO();
        dto.setId(ms.getId());
        dto.setWorkerId(ms.getWorker().getId());
        dto.setWorkerName(ms.getWorker().getName());
        dto.setSettlementMonth(ms.getSettlementMonth());
        dto.setSettlementYear(ms.getSettlementYear());
        dto.setPresentDays(ms.getPresentDays());
        dto.setHalfDays(ms.getHalfDays());
        dto.setAbsentDays(ms.getAbsentDays());
        dto.setOvertimeHours(ms.getOvertimeHours());
        dto.setGrossWage(ms.getGrossWage());
        dto.setTotalAdvance(ms.getTotalAdvance());
        dto.setTotalPayment(ms.getTotalPayment());
        dto.setRemainingBalance(ms.getRemainingBalance());
        dto.setBonus(ms.getBonus());
        dto.setDeduction(ms.getDeduction());
        dto.setStatus(ms.getStatus().name());
        dto.setNotes(ms.getNotes());
        dto.setCreatedAt(ms.getCreatedAt());
        return dto;
    }
}
