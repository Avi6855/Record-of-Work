package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class WorkerService {
    private final WorkerRepository workerRepository;
    private final OrganizationRepository organizationRepository;
    private final AdvanceRepository advanceRepository;
    private final PaymentRepository paymentRepository;
    private final AttendanceRepository attendanceRepository;

    public WorkerService(WorkerRepository workerRepository, OrganizationRepository organizationRepository,
                         AdvanceRepository advanceRepository, PaymentRepository paymentRepository,
                         AttendanceRepository attendanceRepository) {
        this.workerRepository = workerRepository;
        this.organizationRepository = organizationRepository;
        this.advanceRepository = advanceRepository;
        this.paymentRepository = paymentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public PageResponse<WorkerDTO> getAllWorkers(Long orgId, int page, int size, String search) {
        Page<Worker> workerPage;
        if (search != null && !search.isEmpty()) {
            workerPage = workerRepository.search(orgId, search, PageRequest.of(page, size, Sort.by("name")));
        } else {
            workerPage = workerRepository.findByOrganizationIdAndIsDeletedFalse(orgId, PageRequest.of(page, size, Sort.by("name")));
        }
        return PageResponse.of(workerPage.map(w -> toDTO(w, orgId)));
    }

    public WorkerDTO getWorkerById(Long id, Long orgId) {
        Worker worker = workerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        return toDTO(worker, orgId);
    }

    @Transactional
    public WorkerDTO createWorker(Long orgId, CreateWorkerRequest request) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        Worker worker = Worker.builder()
            .organization(org)
            .name(request.getName()).marathiName(request.getMarathiName())
            .phone(request.getPhone()).address(request.getAddress())
            .village(request.getVillage()).workType(request.getWorkType())
            .skill(request.getSkill()).dailyWage(request.getDailyWage())
            .overtimeRate(request.getOvertimeRate())
            .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
            .notes(request.getNotes())
            .build();
        return toDTO(workerRepository.save(worker), orgId);
    }

    @Transactional
    public WorkerDTO updateWorker(Long id, Long orgId, CreateWorkerRequest request) {
        Worker worker = workerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        worker.setName(request.getName());
        worker.setMarathiName(request.getMarathiName());
        worker.setPhone(request.getPhone());
        worker.setAddress(request.getAddress());
        worker.setVillage(request.getVillage());
        worker.setWorkType(request.getWorkType());
        worker.setSkill(request.getSkill());
        worker.setDailyWage(request.getDailyWage());
        worker.setOvertimeRate(request.getOvertimeRate());
        if (request.getJoiningDate() != null) worker.setJoiningDate(request.getJoiningDate());
        worker.setNotes(request.getNotes());
        return toDTO(workerRepository.save(worker), orgId);
    }

    @Transactional
    public void deactivateWorker(Long id) {
        Worker worker = workerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        worker.setIsActive(false);
        workerRepository.save(worker);
    }

    @Transactional
    public void activateWorker(Long id) {
        Worker worker = workerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        worker.setIsActive(true);
        workerRepository.save(worker);
    }

    @Transactional
    public void deleteWorker(Long id) {
        Worker worker = workerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        worker.setIsDeleted(true);
        workerRepository.save(worker);
    }

    public WageCalculationDTO calculateMonthlyWage(Long workerId, int year, int month, Long orgId) {
        Worker worker = workerRepository.findById(workerId)
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        var attendanceList = attendanceRepository.findByWorkerAndMonth(orgId, workerId, year, month);
        int present = 0, halfDay = 0, absent = 0;
        BigDecimal overtimeHours = BigDecimal.ZERO;
        for (Attendance a : attendanceList) {
            switch (a.getStatus()) {
                case PRESENT -> present++;
                case HALF_DAY -> halfDay++;
                case ABSENT, LEAVE, HOLIDAY -> absent++;
                case OVERTIME -> {
                    present++;
                    overtimeHours = overtimeHours.add(a.getOvertimeHours() != null ? a.getOvertimeHours() : BigDecimal.ZERO);
                }
            }
        }
        BigDecimal presentWage = worker.getDailyWage().multiply(BigDecimal.valueOf(present));
        BigDecimal halfDayWage = worker.getDailyWage().divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(halfDay));
        BigDecimal overtimeWage = worker.getOvertimeRate() != null ? worker.getOvertimeRate().multiply(overtimeHours) : BigDecimal.ZERO;
        BigDecimal grossWage = presentWage.add(halfDayWage).add(overtimeWage);
        BigDecimal totalAdvance = advanceRepository.sumAdvancesByWorkerAndMonth(workerId, year, month);
        BigDecimal totalPayment = paymentRepository.sumPaymentsByWorkerAndMonth(workerId, year, month);
        BigDecimal remaining = grossWage.subtract(totalAdvance).subtract(totalPayment);

        WageCalculationDTO dto = new WageCalculationDTO();
        dto.setWorkerId(workerId);
        dto.setWorkerName(worker.getName());
        dto.setPresentDays(present);
        dto.setHalfDays(halfDay);
        dto.setAbsentDays(absent);
        dto.setOvertimeHours(overtimeHours);
        dto.setDailyWage(worker.getDailyWage());
        dto.setOvertimeRate(worker.getOvertimeRate());
        dto.setPresentWage(presentWage);
        dto.setHalfDayWage(halfDayWage);
        dto.setOvertimeWage(overtimeWage);
        dto.setGrossWage(grossWage);
        dto.setTotalAdvance(totalAdvance);
        dto.setTotalPayment(totalPayment);
        dto.setRemainingBalance(remaining);
        return dto;
    }

    public WorkerDTO toDTO(Worker worker, Long orgId) {
        WorkerDTO dto = new WorkerDTO();
        dto.setId(worker.getId());
        dto.setName(worker.getName());
        dto.setMarathiName(worker.getMarathiName());
        dto.setPhone(worker.getPhone());
        dto.setAddress(worker.getAddress());
        dto.setVillage(worker.getVillage());
        dto.setWorkType(worker.getWorkType());
        dto.setSkill(worker.getSkill());
        dto.setDailyWage(worker.getDailyWage());
        dto.setOvertimeRate(worker.getOvertimeRate());
        dto.setJoiningDate(worker.getJoiningDate());
        dto.setNotes(worker.getNotes());
        dto.setIsActive(worker.getIsActive());
        dto.setOrganizationId(worker.getOrganization().getId());
        dto.setCreatedAt(worker.getCreatedAt());
        dto.setTotalAdvance(advanceRepository.sumAdvancesByWorker(worker.getId()));
        dto.setTotalPayment(paymentRepository.sumPaymentsByWorker(worker.getId()));
        BigDecimal outstanding = dto.getTotalAdvance().subtract(dto.getTotalPayment());
        dto.setOutstandingBalance(outstanding);
        return dto;
    }
}
