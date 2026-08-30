package com.recordofwork.repository;

import com.recordofwork.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndIsDeletedFalse(String username);
    Optional<User> findByEmailAndIsDeletedFalse(String email);
    boolean existsByUsernameAndIsDeletedFalse(String username);
    boolean existsByEmailAndIsDeletedFalse(String email);
    Page<User> findByOrganizationIdAndIsDeletedFalse(Long organizationId, Pageable pageable);
    Page<User> findByIsDeletedFalse(Pageable pageable);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.organization.id = :orgId AND u.isDeleted = false")
    Page<User> findByRoleNameAndOrganization(@Param("roleName") String roleName, @Param("orgId") Long orgId, Pageable pageable);
    
    long countByOrganizationIdAndIsDeletedFalse(Long organizationId);
    long countByIsDeletedFalse();
}
