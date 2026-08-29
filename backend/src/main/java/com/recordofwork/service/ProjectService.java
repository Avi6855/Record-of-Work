package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final WorkerRepository workerRepository;
    private final ClientRepository clientRepository;
    private final ClientPaymentRepository clientPaymentRepository;
    private final ExpenseRepository expenseRepository;

    public ProjectService(ProjectRepository projectRepository, OrganizationRepository organizationRepository,
                          WorkerRepository workerRepository, ClientRepository clientRepository,
                          ClientPaymentRepository clientPaymentRepository, ExpenseRepository expenseRepository) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
        this.workerRepository = workerRepository;
        this.clientRepository = clientRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.expenseRepository = expenseRepository;
    }

    public PageResponse<ProjectDTO> getAllProjects(Long orgId, int page, int size, String status) {
        Page<Project> projectPage;
        if (status != null && !status.isEmpty()) {
            Project.ProjectStatus s = Project.ProjectStatus.valueOf(status);
            projectPage = projectRepository.findByOrganizationIdAndStatusAndIsDeletedFalse(orgId, s, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            projectPage = projectRepository.findByOrganizationIdAndIsDeletedFalse(orgId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }
        return PageResponse.of(projectPage.map(this::toDTO));
    }

    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        return toDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(Long orgId, CreateProjectRequest request) {
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
        Project project = Project.builder()
            .organization(org).name(request.getName()).marathiName(request.getMarathiName())
            .clientPhone(request.getClientPhone()).siteAddress(request.getSiteAddress())
            .startDate(request.getStartDate()).endDate(request.getEndDate())
            .contractAmount(request.getContractAmount()).description(request.getDescription())
            .notes(request.getNotes())
            .build();
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
            project.setClient(client);
        }
        if (request.getWorkerIds() != null && !request.getWorkerIds().isEmpty()) {
            Set<Worker> workers = new HashSet<>(workerRepository.findAllById(request.getWorkerIds()));
            project.setWorkers(workers);
        }
        return toDTO(projectRepository.save(project));
    }

    @Transactional
    public ProjectDTO updateProject(Long id, CreateProjectRequest request) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setName(request.getName());
        project.setMarathiName(request.getMarathiName());
        project.setClientPhone(request.getClientPhone());
        project.setSiteAddress(request.getSiteAddress());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setContractAmount(request.getContractAmount());
        project.setDescription(request.getDescription());
        project.setNotes(request.getNotes());
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
            project.setClient(client);
        }
        return toDTO(projectRepository.save(project));
    }

    @Transactional
    public void updateProjectStatus(Long id, String status) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setStatus(Project.ProjectStatus.valueOf(status));
        projectRepository.save(project);
    }

    @Transactional
    public void assignWorkers(Long projectId, Set<Long> workerIds) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        Set<Worker> workers = new HashSet<>(workerRepository.findAllById(workerIds));
        project.setWorkers(workers);
        projectRepository.save(project);
    }

    public List<ProjectDTO> getWorkerProjects(Long workerId) {
        return projectRepository.findByWorkerId(workerId).stream().map(this::toDTO).toList();
    }

    public ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setMarathiName(project.getMarathiName());
        if (project.getClient() != null) {
            dto.setClientId(project.getClient().getId());
            dto.setClientName(project.getClient().getName());
        }
        dto.setClientPhone(project.getClientPhone());
        dto.setSiteAddress(project.getSiteAddress());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setContractAmount(project.getContractAmount());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus().name());
        dto.setNotes(project.getNotes());
        dto.setCreatedAt(project.getCreatedAt());
        if (project.getWorkers() != null) {
            dto.setWorkers(project.getWorkers().stream().map(w -> {
                WorkerDTO wd = new WorkerDTO();
                wd.setId(w.getId());
                wd.setName(w.getName());
                wd.setMarathiName(w.getMarathiName());
                return wd;
            }).toList());
        }
        dto.setTotalExpense(expenseRepository.sumExpensesByProject(project.getId()));
        dto.setTotalClientPayment(clientPaymentRepository.sumByProject(project.getId()));
        if (project.getContractAmount() != null) {
            dto.setPendingAmount(project.getContractAmount().subtract(dto.getTotalClientPayment()));
            dto.setEstimatedProfit(project.getContractAmount().subtract(dto.getTotalExpense()));
        }
        return dto;
    }
}
