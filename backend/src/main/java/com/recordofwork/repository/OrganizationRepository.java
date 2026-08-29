package com.recordofwork.repository;

import com.recordofwork.entity.Organization;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Page<Organization> findByIsDeletedFalse(Pageable pageable);
    List<Organization> findByIsActiveAndIsDeletedFalse(boolean isActive);
    long countByIsActiveAndIsDeletedFalse(boolean isActive);
    long countByIsDeletedFalse();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.organization.id = :orgId AND u.isDeleted = false")
    long countUsersByOrganization(Long orgId);
}
