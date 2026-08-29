package com.recordofwork.service;

import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long orgId, Long userId, String username, String action, String entityType,
                    Long entityId, String oldValue, String newValue, String ip) {
        Organization org = null;
        if (orgId != null) {
            org = new Organization();
            org.setId(orgId);
        }
        AuditLog auditLog = AuditLog.builder()
            .organization(org)
            .userId(userId).username(username).action(action)
            .entityType(entityType).entityId(entityId)
            .oldValue(oldValue).newValue(newValue)
            .ipAddress(ip).status("SUCCESS")
            .build();
        auditLogRepository.save(auditLog);
    }

    public Page<AuditLog> getAuditLogs(Long orgId, int page, int size) {
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId, PageRequest.of(page, size));
    }
}
