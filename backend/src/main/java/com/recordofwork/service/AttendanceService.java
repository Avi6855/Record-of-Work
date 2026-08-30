package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, WorkerRepository workerRepository,
                             ProjectRepository projectRepository, OrganizationRepository organizationRepository) {
        this.attendanceRepository = attendanceRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
    }

    public List<AttendanceDTO> getDailyAttendance(Long orgId, Long projectId, LocalDate date) {
        List<Attendance> attendances = attendanceRepository.findByOrganizationIdAndAttendanceDateAndIsCorrectedFalse(orgId, date);
        return attendances.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Map<String, Map<Long, String>> getNotebookView(Long orgId, Long projectId, int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        List<Attendance> attendances = attendanceRepository.findByOrganizationIdAndAttendanceDateBetween(orgId, startDate, endDate);

        Map<Long, Map<String, String>> notebook = new LinkedHashMap<>();
        List<Worker> workers = workerRepository.findByOrganizationIdAndIsActiveAndIsDeletedFalse(orgId, true);

        for (Worker w : workers) {
            Map<String, String> dailyStatus = new LinkedHashMap<>();
            for (Attendance a : attendances) {
                if (a.getWorker().getId().equals(w.getId()) && a.getProject().getId().equals(projectId)) {
                    dailyStatus.put(a.getAttendanceDate().toString(), mapStatus(a.getStatus().name()));
                }
            }
            notebook.put(w.getId(), dailyStatus);
        }

        Map<String, Map<Long, String>> result = new LinkedHashMap<>();
        LocalDate d = startDate;
        while (!d.isAfter(endDate)) {
            Map<Long, String> dayMap = new LinkedHashMap<>();
            for (Worker w : workers) {
                dayMap.put(w.getId(), notebook.getOrDefault(w.getId(), Collections.emptyMap())
                    .getOrDefault(d.toString(), ""));
            }
            result.put(d.toString(), dayMap);
            d = d.plusDays(1);
        }
        return result;
    }

    @Transactional
    public AttendanceDTO markAttendance(Long orgId, MarkAttendanceRequest request) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        Worker worker = workerRepository.findById(request.getWorkerId())
            .orElseThrow(() -> new RuntimeException("Worker not found"));
        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new RuntimeException("Project not found"));

        Optional<Attendance> existing = attendanceRepository
            .findByWorkerIdAndProjectIdAndAttendanceDate(request.getWorkerId(), request.getProjectId(), request.getAttendanceDate());

        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus(Attendance.AttendanceStatus.valueOf(request.getStatus()));
            attendance.setOvertimeHours(request.getOvertimeHours());
            attendance.setNotes(request.getNotes());
        } else {
            attendance = Attendance.builder()
                .organization(org).worker(worker).project(project)
                .attendanceDate(request.getAttendanceDate())
                .status(Attendance.AttendanceStatus.valueOf(request.getStatus()))
                .overtimeHours(request.getOvertimeHours())
                .notes(request.getNotes())
                .entrySource(Attendance.EntrySource.MANUAL)
                .build();
        }
        return toDTO(attendanceRepository.save(attendance));
    }

    @Transactional
    public List<AttendanceDTO> markBulkAttendance(Long orgId, BulkAttendanceRequest request) {
        List<AttendanceDTO> results = new ArrayList<>();
        for (BulkAttendanceRequest.WorkerAttendance wa : request.getAttendances()) {
            MarkAttendanceRequest mar = new MarkAttendanceRequest();
            mar.setWorkerId(wa.getWorkerId());
            mar.setProjectId(request.getProjectId());
            mar.setAttendanceDate(request.getAttendanceDate());
            mar.setStatus(wa.getStatus());
            mar.setNotes(wa.getNotes());
            results.add(markAttendance(orgId, mar));
        }
        return results;
    }

    @Transactional
    public void markAllPresent(Long orgId, Long projectId, LocalDate date) {
        List<Worker> workers = workerRepository.findByOrganizationIdAndIsActiveAndIsDeletedFalse(orgId, true);
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Project project = projectRepository.findById(projectId).orElseThrow();
        for (Worker w : workers) {
            if (attendanceRepository.findByWorkerIdAndProjectIdAndAttendanceDate(w.getId(), projectId, date).isEmpty()) {
                Attendance a = Attendance.builder()
                    .organization(org).worker(w).project(project)
                    .attendanceDate(date).status(Attendance.AttendanceStatus.PRESENT)
                    .entrySource(Attendance.EntrySource.BULK).build();
                attendanceRepository.save(a);
            }
        }
    }

    @Transactional
    public void markAllAbsent(Long orgId, Long projectId, LocalDate date) {
        List<Worker> workers = workerRepository.findByOrganizationIdAndIsActiveAndIsDeletedFalse(orgId, true);
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Project project = projectRepository.findById(projectId).orElseThrow();
        for (Worker w : workers) {
            if (attendanceRepository.findByWorkerIdAndProjectIdAndAttendanceDate(w.getId(), projectId, date).isEmpty()) {
                Attendance a = Attendance.builder()
                    .organization(org).worker(w).project(project)
                    .attendanceDate(date).status(Attendance.AttendanceStatus.ABSENT)
                    .entrySource(Attendance.EntrySource.BULK).build();
                attendanceRepository.save(a);
            }
        }
    }

    @Transactional
    public void copyPreviousDay(Long orgId, Long projectId, LocalDate date) {
        LocalDate prevDate = date.minusDays(1);
        List<Attendance> prevAttendances = attendanceRepository.findByOrganizationIdAndAttendanceDateAndIsCorrectedFalse(orgId, prevDate);
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        for (Attendance prev : prevAttendances) {
            if (prev.getProject().getId().equals(projectId) &&
                attendanceRepository.findByWorkerIdAndProjectIdAndAttendanceDate(prev.getWorker().getId(), projectId, date).isEmpty()) {
                Attendance a = Attendance.builder()
                    .organization(org).worker(prev.getWorker()).project(prev.getProject())
                    .attendanceDate(date).status(prev.getStatus())
                    .entrySource(Attendance.EntrySource.BULK).build();
                attendanceRepository.save(a);
            }
        }
    }

    public Map<String, Long> getAttendanceSummary(Long orgId, LocalDate date) {
        return Map.of(
            "total", attendanceRepository.countTotalByDate(orgId, date),
            "present", attendanceRepository.countPresentByDate(orgId, date),
            "absent", attendanceRepository.countAbsentByDate(orgId, date),
            "halfDay", attendanceRepository.countHalfDayByDate(orgId, date)
        );
    }

    private String mapStatus(String status) {
        return switch (status) {
            case "PRESENT" -> "\u2713";
            case "ABSENT" -> "X";
            case "HALF_DAY" -> "\u00BD";
            case "OVERTIME" -> "OT";
            case "LEAVE" -> "L";
            case "HOLIDAY" -> "H";
            default -> "";
        };
    }

    public AttendanceDTO toDTO(Attendance a) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(a.getId());
        dto.setWorkerId(a.getWorker().getId());
        dto.setWorkerName(a.getWorker().getName());
        dto.setWorkerMarathiName(a.getWorker().getMarathiName());
        dto.setProjectId(a.getProject().getId());
        dto.setProjectName(a.getProject().getName());
        dto.setAttendanceDate(a.getAttendanceDate());
        dto.setStatus(a.getStatus().name());
        dto.setOvertimeHours(a.getOvertimeHours());
        dto.setNotes(a.getNotes());
        dto.setEntrySource(a.getEntrySource().name());
        dto.setIsCorrected(a.getIsCorrected());
        return dto;
    }
}
