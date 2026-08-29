package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AdvanceService {
    private final AdvanceRepository advanceRepository;
    private final WorkerRepository workerRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    public AdvanceService(AdvanceRepository advanceRepository, WorkerRepository workerRepository,
                          ProjectRepository projectRepository, OrganizationRepository organizationRepository) {
        this.advanceRepository = advanceRepository;
        this.workerRepository = workerRepository;
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
    }

    public PageResponse<AdvanceDTO> getAllAdvances(Long orgId, int page, int size) {
        Page<Advance> page1 = advanceRepository.findByOrganizationIdAndIsVoidedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    public List<AdvanceDTO> getWorkerAdvances(Long workerId) {
        return advanceRepository.findByWorkerIdAndIsVoidedFalseOrderByAdvanceDateDesc(workerId)
            .stream().map(this::toDTO).toList();
    }

    @Transactional
    public AdvanceDTO createAdvance(Long orgId, CreateAdvanceRequest request) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Worker worker = workerRepository.findById(request.getWorkerId()).orElseThrow();
        Advance advance = Advance.builder()
            .organization(org).worker(worker)
            .amount(request.getAmount()).advanceDate(request.getAdvanceDate())
            .paymentMethod(Advance.PaymentMethod.valueOf(request.getPaymentMethod()))
            .reason(request.getReason()).notes(request.getNotes())
            .build();
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId()).orElseThrow();
            advance.setProject(project);
        }
        return toDTO(advanceRepository.save(advance));
    }

    @Transactional
    public void voidAdvance(Long id, Long userId, String reason) {
        Advance advance = advanceRepository.findById(id).orElseThrow();
        advance.setIsVoided(true);
        advance.setVoidedBy(userId);
        advance.setVoidReason(reason);
        advance.setVoidedAt(java.time.LocalDateTime.now());
        advanceRepository.save(advance);
    }

    public AdvanceDTO toDTO(Advance a) {
        AdvanceDTO dto = new AdvanceDTO();
        dto.setId(a.getId());
        dto.setWorkerId(a.getWorker().getId());
        dto.setWorkerName(a.getWorker().getName());
        dto.setAmount(a.getAmount());
        dto.setAdvanceDate(a.getAdvanceDate());
        dto.setPaymentMethod(a.getPaymentMethod().name());
        dto.setReason(a.getReason());
        dto.setNotes(a.getNotes());
        dto.setIsSettled(a.getIsSettled());
        dto.setSettledAmount(a.getSettledAmount());
        dto.setIsVoided(a.getIsVoided());
        dto.setCreatedAt(a.getCreatedAt());
        if (a.getProject() != null) {
            dto.setProjectId(a.getProject().getId());
            dto.setProjectName(a.getProject().getName());
        }
        return dto;
    }
}
