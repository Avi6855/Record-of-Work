package com.recordofwork.repository;

import com.recordofwork.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Page<Client> findByOrganizationIdAndIsDeletedFalse(Long organizationId, Pageable pageable);
    List<Client> findByOrganizationIdAndIsDeletedFalse(Long organizationId);
    long countByOrganizationIdAndIsDeletedFalse(Long organizationId);
}
