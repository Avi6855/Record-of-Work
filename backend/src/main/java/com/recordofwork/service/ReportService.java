package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class ReportService {
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;
    private final AdvanceRepository advanceRepository;
    private final ExpenseRepository expenseRepository;
    private final ClientPaymentRepository clientPaymentRepository;
    private final WorkerRepository workerRepository;

    public ReportService(AttendanceRepository attendanceRepository, PaymentRepository paymentRepository,
                         AdvanceRepository advanceRepository, ExpenseRepository expenseRepository,
                         ClientPaymentRepository clientPaymentRepository, WorkerRepository workerRepository) {
        this.attendanceRepository = attendanceRepository;
        this.paymentRepository = paymentRepository;
        this.advanceRepository = advanceRepository;
        this.expenseRepository = expenseRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.workerRepository = workerRepository;
    }

    public ReportDTO getFinancialReport(Long orgId, LocalDate startDate, LocalDate endDate) {
        ReportDTO report = new ReportDTO();
        report.setReportType("FINANCIAL");
        report.setStartDate(startDate);
        report.setEndDate(endDate);
        ReportDTO.ReportSummary summary = new ReportDTO.ReportSummary();
        summary.setTotalWages(BigDecimal.ZERO);
        summary.setTotalAdvances(advanceRepository.sumAdvancesByDate(orgId, startDate));
        summary.setTotalPayments(paymentRepository.sumPaymentsByDate(orgId, startDate));
        summary.setTotalExpenses(expenseRepository.sumExpensesByDate(orgId, startDate));
        summary.setTotalIncome(clientPaymentRepository.sumAllByOrganization(orgId));
        summary.setOutstanding(summary.getTotalAdvances().subtract(summary.getTotalPayments()));
        summary.setNetBalance(summary.getTotalIncome().subtract(summary.getTotalExpenses()).subtract(summary.getTotalPayments()));
        report.setSummary(summary);
        report.setRows(new ArrayList<>());
        return report;
    }
}
