package com.recordofwork.repository;

import com.recordofwork.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByOrganizationIdAndAttendanceDateAndIsCorrectedFalse(Long organizationId, LocalDate date);
    List<Attendance> findByWorkerIdAndAttendanceDateBetween(Long workerId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByProjectIdAndAttendanceDateBetween(Long projectId, LocalDate startDate, LocalDate endDate);
    Optional<Attendance> findByWorkerIdAndProjectIdAndAttendanceDate(Long workerId, Long projectId, LocalDate date);
    List<Attendance> findByOrganizationIdAndAttendanceDateBetween(Long organizationId, LocalDate startDate, LocalDate endDate);
    Page<Attendance> findByOrganizationIdAndAttendanceDateBetween(Long organizationId, LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<Attendance> findByWorkerIdAndAttendanceDateBetween(Long workerId, LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.organization.id = :orgId AND a.attendanceDate = :date AND a.status = 'PRESENT'")
    long countPresentByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.organization.id = :orgId AND a.attendanceDate = :date AND a.status = 'ABSENT'")
    long countAbsentByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.organization.id = :orgId AND a.attendanceDate = :date AND a.status = 'HALF_DAY'")
    long countHalfDayByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.organization.id = :orgId AND a.attendanceDate = :date")
    long countTotalByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Attendance a WHERE a.organization.id = :orgId AND a.worker.id = :workerId AND YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month")
    List<Attendance> findByWorkerAndMonth(@Param("orgId") Long orgId, @Param("workerId") Long workerId, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT a FROM Attendance a WHERE a.organization.id = :orgId AND YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month AND a.status = 'PRESENT'")
    long countPresentDaysByMonth(@Param("orgId") Long orgId, @Param("year") int year, @Param("month") int month);
}
