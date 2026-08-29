package com.recordofwork.repository;

import com.recordofwork.entity.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findByWorkerIdAndIsVoidedFalseOrderByEntryDateAsc(Long workerId);
    List<LedgerEntry> findByProjectIdAndIsVoidedFalseOrderByEntryDateAsc(Long projectId);
    Page<LedgerEntry> findByOrganizationIdAndIsVoidedFalse(Long organizationId, Pageable pageable);
    List<LedgerEntry> findByOrganizationIdAndEntryDateBetweenAndIsVoidedFalse(Long organizationId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT le FROM LedgerEntry le WHERE le.worker.id = :workerId AND le.isVoided = false ORDER BY le.entryDate ASC, le.createdAt ASC")
    List<LedgerEntry> findWorkerLedger(@Param("workerId") Long workerId);
    
    @Query("SELECT le FROM LedgerEntry le WHERE le.project.id = :projectId AND le.isVoided = false ORDER BY le.entryDate ASC, le.createdAt ASC")
    List<LedgerEntry> findProjectLedger(@Param("projectId") Long projectId);
}
