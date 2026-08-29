package com.recordofwork.repository;

import com.recordofwork.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByOrganizationIdAndIsDeletedFalse(Long organizationId, Pageable pageable);
    Page<Project> findByOrganizationIdAndStatusAndIsDeletedFalse(Long organizationId, Project.ProjectStatus status, Pageable pageable);
    List<Project> findByOrganizationIdAndStatusAndIsDeletedFalse(Long organizationId, Project.ProjectStatus status);
    long countByOrganizationIdAndIsDeletedFalse(Long organizationId);
    long countByOrganizationIdAndStatusAndIsDeletedFalse(Long organizationId, Project.ProjectStatus status);
    
    @Query("SELECT p FROM Project p JOIN p.workers w WHERE w.id = :workerId AND p.isDeleted = false")
    List<Project> findByWorkerId(@Param("workerId") Long workerId);
}
