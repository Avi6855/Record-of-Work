package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.Organization;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;

    public OrganizationService(OrganizationRepository organizationRepository, UserRepository userRepository,
                               WorkerRepository workerRepository, ProjectRepository projectRepository) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
    }

    public PageResponse<OrganizationDTO> getAllOrganizations(int page, int size) {
        Page<Organization> orgPage = organizationRepository.findByIsDeletedFalse(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return PageResponse.of(orgPage.map(this::toDTO));
    }

    @Transactional
    public OrganizationDTO createOrganization(OrganizationDTO dto) {
        Organization org = Organization.builder()
            .name(dto.getName()).marathiName(dto.getMarathiName())
            .contactPerson(dto.getContactPerson()).contactEmail(dto.getContactEmail())
            .contactPhone(dto.getContactPhone()).address(dto.getAddress())
            .build();
        return toDTO(organizationRepository.save(org));
    }

    @Transactional
    public OrganizationDTO updateOrganization(Long id, OrganizationDTO dto) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        org.setName(dto.getName());
        org.setMarathiName(dto.getMarathiName());
        org.setContactPerson(dto.getContactPerson());
        org.setContactEmail(dto.getContactEmail());
        org.setContactPhone(dto.getContactPhone());
        org.setAddress(dto.getAddress());
        return toDTO(organizationRepository.save(org));
    }

    public OrganizationDTO getOrganizationById(Long id) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        return toDTO(org);
    }

    @Transactional
    public void deleteOrganization(Long id) {
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        org.setIsDeleted(true);
        organizationRepository.save(org);
    }

    public long getStats(Long orgId) {
        return organizationRepository.countByIsDeletedFalse();
    }

    private OrganizationDTO toDTO(Organization org) {
        OrganizationDTO dto = new OrganizationDTO();
        dto.setId(org.getId());
        dto.setName(org.getName());
        dto.setMarathiName(org.getMarathiName());
        dto.setContactPerson(org.getContactPerson());
        dto.setContactEmail(org.getContactEmail());
        dto.setContactPhone(org.getContactPhone());
        dto.setAddress(org.getAddress());
        dto.setCurrency(org.getCurrency());
        dto.setIsActive(org.getIsActive());
        dto.setIsSuspended(org.getIsSuspended());
        dto.setCreatedAt(org.getCreatedAt());
        dto.setUserCount(userRepository.countByOrganizationIdAndIsDeletedFalse(org.getId()));
        dto.setWorkerCount(workerRepository.countByOrganizationIdAndIsDeletedFalse(org.getId()));
        dto.setProjectCount(projectRepository.countByOrganizationIdAndIsDeletedFalse(org.getId()));
        return dto;
    }
}
