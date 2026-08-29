package com.recordofwork.repository;

import com.recordofwork.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId, Pageable pageable);
    Page<AuditLog> findByActionContainingAndOrganizationIdOrderByCreatedAtDesc(String action, Long organizationId, Pageable pageable);
}
