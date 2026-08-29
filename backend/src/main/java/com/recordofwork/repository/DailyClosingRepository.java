package com.recordofwork.repository;

import com.recordofwork.entity.DailyClosing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyClosingRepository extends JpaRepository<DailyClosing, Long> {
    Optional<DailyClosing> findByOrganizationIdAndClosingDate(Long organizationId, LocalDate closingDate);
    boolean existsByOrganizationIdAndClosingDateAndIsClosedTrue(Long organizationId, LocalDate closingDate);
}
