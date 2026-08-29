package com.recordofwork.repository;

import com.recordofwork.entity.Worker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    Page<Worker> findByOrganizationIdAndIsDeletedFalse(Long organizationId, Pageable pageable);
    Page<Worker> findByOrganizationIdAndIsActiveAndIsDeletedFalse(Long organizationId, boolean isActive, Pageable pageable);
    List<Worker> findByOrganizationIdAndIsActiveAndIsDeletedFalse(Long organizationId, boolean isActive);
    long countByOrganizationIdAndIsDeletedFalse(Long organizationId);
    long countByOrganizationIdAndIsActiveAndIsDeletedFalse(Long organizationId, boolean isActive);
    
    @Query("SELECT w FROM Worker w WHERE w.organization.id = :orgId AND w.isDeleted = false AND (LOWER(w.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.marathiName) LIKE LOWER(CONCAT('%', :query, '%')) OR w.phone LIKE CONCAT('%', :query, '%'))")
    Page<Worker> search(@Param("orgId") Long orgId, @Param("query") String query, Pageable pageable);
    
    List<Worker> findByIdIn(List<Long> ids);
}
