package com.recordofwork.service;

import com.recordofwork.dto.DashboardDTO;
import com.recordofwork.dto.DashboardDTO.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class DashboardService {
    private final WorkerRepository workerRepository;
    private final AttendanceRepository attendanceRepository;
    private final PaymentRepository paymentRepository;
    private final AdvanceRepository advanceRepository;
    private final ExpenseRepository expenseRepository;
    private final ClientPaymentRepository clientPaymentRepository;
    private final ProjectRepository projectRepository;

    public DashboardService(WorkerRepository workerRepository, AttendanceRepository attendanceRepository,
                            PaymentRepository paymentRepository, AdvanceRepository advanceRepository,
                            ExpenseRepository expenseRepository, ClientPaymentRepository clientPaymentRepository,
                            ProjectRepository projectRepository) {
        this.workerRepository = workerRepository;
        this.attendanceRepository = attendanceRepository;
        this.paymentRepository = paymentRepository;
        this.advanceRepository = advanceRepository;
        this.expenseRepository = expenseRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.projectRepository = projectRepository;
    }

    public DashboardDTO getDashboard(Long orgId) {
        DashboardDTO dashboard = new DashboardDTO();
        LocalDate today = LocalDate.now();

        TodaySummary todaySummary = new TodaySummary();
        todaySummary.setTotalWorkers((int) workerRepository.countByOrganizationIdAndIsActiveAndIsDeletedFalse(orgId, true));
        todaySummary.setPresent((int) attendanceRepository.countPresentByDate(orgId, today));
        todaySummary.setAbsent((int) attendanceRepository.countAbsentByDate(orgId, today));
        todaySummary.setHalfDay((int) attendanceRepository.countHalfDayByDate(orgId, today));
        todaySummary.setTodayWages(BigDecimal.ZERO);
        todaySummary.setTodayAdvances(advanceRepository.sumAdvancesByDate(orgId, today));
        todaySummary.setTodayPayments(paymentRepository.sumPaymentsByDate(orgId, today));
        todaySummary.setTodayExpenses(expenseRepository.sumExpensesByDate(orgId, today));
        dashboard.setToday(todaySummary);

        OverallSummary overall = new OverallSummary();
        int year = today.getYear();
        int month = today.getMonthValue();
        overall.setMonthlyWages(BigDecimal.ZERO);
        overall.setMonthlyExpenses(expenseRepository.sumExpensesByMonth(orgId, year, month));
        overall.setMonthlyIncome(clientPaymentRepository.sumAllByOrganization(orgId));
        overall.setClientPending(BigDecimal.ZERO);
        overall.setAvailableCash(BigDecimal.ZERO);
        dashboard.setOverall(overall);

        dashboard.setRecentActivities(new ArrayList<>());
        return dashboard;
    }
}
