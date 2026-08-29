package com.recordofwork.repository;

import com.recordofwork.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByWorkerIdAndIsVoidedFalseOrderByPaymentDateDesc(Long workerId);
    Page<Payment> findByOrganizationIdAndIsVoidedFalse(Long organizationId, Pageable pageable);
    List<Payment> findByOrganizationIdAndPaymentDateBetweenAndIsVoidedFalse(Long organizationId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.worker.id = :workerId AND p.isVoided = false")
    BigDecimal sumPaymentsByWorker(@Param("workerId") Long workerId);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.worker.id = :workerId AND p.isVoided = false AND YEAR(p.paymentDate) = :year AND MONTH(p.paymentDate) = :month")
    BigDecimal sumPaymentsByWorkerAndMonth(@Param("workerId") Long workerId, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.organization.id = :orgId AND p.paymentDate = :date AND p.isVoided = false")
    BigDecimal sumPaymentsByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    long countByOrganizationIdAndIsVoidedFalse(Long organizationId);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.organization.id = :orgId AND p.isVoided = false")
    BigDecimal sumAllByOrganization(@Param("orgId") Long orgId);
}
