package com.recordofwork.repository;

import com.recordofwork.entity.Expense;
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
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    Page<Expense> findByOrganizationIdAndIsVoidedFalse(Long organizationId, Pageable pageable);
    List<Expense> findByOrganizationIdAndExpenseDateBetweenAndIsVoidedFalse(Long organizationId, LocalDate startDate, LocalDate endDate);
    List<Expense> findByProjectIdAndIsVoidedFalse(Long projectId);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.organization.id = :orgId AND e.expenseDate = :date AND e.isVoided = false")
    BigDecimal sumExpensesByDate(@Param("orgId") Long orgId, @Param("date") LocalDate date);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.organization.id = :orgId AND e.isVoided = false AND YEAR(e.expenseDate) = :year AND MONTH(e.expenseDate) = :month")
    BigDecimal sumExpensesByMonth(@Param("orgId") Long orgId, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.project.id = :projectId AND e.isVoided = false")
    BigDecimal sumExpensesByProject(@Param("projectId") Long projectId);
    
    long countByOrganizationIdAndIsVoidedFalse(Long organizationId);
    
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.organization.id = :orgId AND e.isVoided = false")
    BigDecimal sumAllByOrganization(@Param("orgId") Long orgId);
}
