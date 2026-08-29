package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class DailyClosingService {
    private final DailyClosingRepository dailyClosingRepository;
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;
    private final AdvanceRepository advanceRepository;
    private final ExpenseRepository expenseRepository;
    private final WorkerRepository workerRepository;
    private final OrganizationRepository organizationRepository;

    public DailyClosingService(DailyClosingRepository dailyClosingRepository, AttendanceRepository attendanceRepository,
                               PaymentRepository paymentRepository, AdvanceRepository advanceRepository,
                               ExpenseRepository expenseRepository, WorkerRepository workerRepository,
                               OrganizationRepository organizationRepository) {
        this.dailyClosingRepository = dailyClosingRepository;
        this.attendanceRepository = attendanceRepository;
        this.paymentRepository = paymentRepository;
        this.advanceRepository = advanceRepository;
        this.expenseRepository = expenseRepository;
        this.workerRepository = workerRepository;
        this.organizationRepository = organizationRepository;
    }

    public DailyClosingDTO getDailyClosing(Long orgId, LocalDate date) {
        return dailyClosingRepository.findByOrganizationIdAndClosingDate(orgId, date)
            .map(this::toDTO)
            .orElseGet(() -> createDraftClosing(orgId, date));
    }

    private DailyClosingDTO createDraftClosing(Long orgId, LocalDate date) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        int totalWorkers = (int) workerRepository.countByOrganizationIdAndIsActiveAndIsDeletedFalse(orgId, true);
        long present = attendanceRepository.countPresentByDate(orgId, date);
        long absent = attendanceRepository.countAbsentByDate(orgId, date);
        long halfDay = attendanceRepository.countHalfDayByDate(orgId, date);

        DailyClosing closing = DailyClosing.builder()
            .organization(org).closingDate(date)
            .totalWorkers(totalWorkers)
            .presentCount((int) present).absentCount((int) absent).halfDayCount((int) halfDay)
            .totalWages(BigDecimal.ZERO)
            .totalAdvances(advanceRepository.sumAdvancesByDate(orgId, date))
            .totalPayments(paymentRepository.sumPaymentsByDate(orgId, date))
            .totalExpenses(expenseRepository.sumExpensesByDate(orgId, date))
            .totalIncome(BigDecimal.ZERO)
            .build();
        return toDTO(dailyClosingRepository.save(closing));
    }

    @Transactional
    public DailyClosingDTO closeDay(Long orgId, LocalDate date, Long userId, String notes) {
        DailyClosing closing = dailyClosingRepository.findByOrganizationIdAndClosingDate(orgId, date)
            .orElseGet(() -> {
                createDraftClosing(orgId, date);
                return dailyClosingRepository.findByOrganizationIdAndClosingDate(orgId, date).orElseThrow();
            });
        closing.setIsClosed(true);
        closing.setClosedBy(userId);
        closing.setClosedAt(java.time.LocalDateTime.now());
        closing.setNotes(notes);
        return toDTO(dailyClosingRepository.save(closing));
    }

    public boolean isDayClosed(Long orgId, LocalDate date) {
        return dailyClosingRepository.existsByOrganizationIdAndClosingDateAndIsClosedTrue(orgId, date);
    }

    private DailyClosingDTO toDTO(DailyClosing dc) {
        DailyClosingDTO dto = new DailyClosingDTO();
        dto.setId(dc.getId());
        dto.setClosingDate(dc.getClosingDate());
        dto.setTotalWorkers(dc.getTotalWorkers());
        dto.setPresentCount(dc.getPresentCount());
        dto.setAbsentCount(dc.getAbsentCount());
        dto.setHalfDayCount(dc.getHalfDayCount());
        dto.setTotalWages(dc.getTotalWages());
        dto.setTotalAdvances(dc.getTotalAdvances());
        dto.setTotalPayments(dc.getTotalPayments());
        dto.setTotalExpenses(dc.getTotalExpenses());
        dto.setTotalIncome(dc.getTotalIncome());
        dto.setOpeningCash(dc.getOpeningCash());
        dto.setClosingCash(dc.getClosingCash());
        dto.setNotes(dc.getNotes());
        dto.setIsClosed(dc.getIsClosed());
        dto.setClosedAt(dc.getClosedAt());
        return dto;
    }
}
