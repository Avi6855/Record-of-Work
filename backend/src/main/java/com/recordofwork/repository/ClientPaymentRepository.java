package com.recordofwork.repository;

import com.recordofwork.entity.ClientPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ClientPaymentRepository extends JpaRepository<ClientPayment, Long> {
    List<ClientPayment> findByProjectIdAndIsVoidedFalseOrderByPaymentDateDesc(Long projectId);
    Page<ClientPayment> findByOrganizationIdAndIsVoidedFalse(Long organizationId, Pageable pageable);
    
    @Query("SELECT COALESCE(SUM(cp.amount), 0) FROM ClientPayment cp WHERE cp.project.id = :projectId AND cp.isVoided = false")
    BigDecimal sumByProject(@Param("projectId") Long projectId);
    
    @Query("SELECT COALESCE(SUM(cp.amount), 0) FROM ClientPayment cp WHERE cp.organization.id = :orgId AND cp.isVoided = false")
    BigDecimal sumAllByOrganization(@Param("orgId") Long orgId);
    
    @Query("SELECT COALESCE(SUM(cp.amount), 0) FROM ClientPayment cp WHERE cp.client.id = :clientId AND cp.isVoided = false")
    BigDecimal sumByClient(@Param("clientId") Long clientId);
}
