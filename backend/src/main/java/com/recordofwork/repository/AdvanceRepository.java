package com.recordofwork.repository;

import com.recordofwork.entity.Advance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdvanceRepository extends JpaRepository<Advance, Long> {
    List<Advance> findByWorkerIdAndIsVoidedFalseOrderByAdvanceDateDesc(Long workerId);
    Page<Advance> findByOrganizationIdAndIsVoidedFalse(Long organizationId, Pageable pageable);
    List<Advance> findByOrganizationIdAndAdvanceDateBetweenAndIsVoidedFalse(Long organizationId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM Advance a WHERE a.worker.id = :workerId AND a.isVoided = false")
    BigDecimal sumAdvancesByWorker(@Param("workerId") Long workerId);
    
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM Advance a WHERE a.worker.id = :workerId AND a.isVoided = false AND YEAR(a.advanceDate) = :year AND MONTH(a.advanceDate) = :month")
    BigDecimal sumAdvancesByWorkerAndMonth(@Param("workerId") Long workerId, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM Advance a WHERE a.organization.id = :orgId AND a.advanceDate = :date AND a.isVoided = false")
    BigDecimal sumAdvancesByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    long countByOrganizationIdAndIsVoidedFalse(Long organizationId);
}
