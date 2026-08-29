package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientPaymentService {
    private final ClientPaymentRepository clientPaymentRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    public ClientPaymentService(ClientPaymentRepository clientPaymentRepository, ClientRepository clientRepository,
                                ProjectRepository projectRepository, OrganizationRepository organizationRepository) {
        this.clientPaymentRepository = clientPaymentRepository;
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
    }

    public PageResponse<ClientPaymentDTO> getAllClientPayments(Long orgId, int page, int size) {
        Page<ClientPayment> page1 = clientPaymentRepository.findByOrganizationIdAndIsVoidedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    @Transactional
    public ClientPaymentDTO createClientPayment(Long orgId, CreateClientPaymentRequest request) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Client client = clientRepository.findById(request.getClientId()).orElseThrow();
        Project project = projectRepository.findById(request.getProjectId()).orElseThrow();

        ClientPayment cp = ClientPayment.builder()
            .organization(org).client(client).project(project)
            .amount(request.getAmount()).paymentDate(request.getPaymentDate())
            .paymentMethod(ClientPayment.PaymentMethod.valueOf(request.getPaymentMethod()))
            .referenceNumber(request.getReferenceNumber())
            .description(request.getDescription()).notes(request.getNotes())
            .build();
        return toDTO(clientPaymentRepository.save(cp));
    }

    private ClientPaymentDTO toDTO(ClientPayment cp) {
        ClientPaymentDTO dto = new ClientPaymentDTO();
        dto.setId(cp.getId());
        dto.setClientId(cp.getClient().getId());
        dto.setClientName(cp.getClient().getName());
        dto.setProjectId(cp.getProject().getId());
        dto.setProjectName(cp.getProject().getName());
        dto.setAmount(cp.getAmount());
        dto.setPaymentDate(cp.getPaymentDate());
        dto.setPaymentMethod(cp.getPaymentMethod().name());
        dto.setReferenceNumber(cp.getReferenceNumber());
        dto.setDescription(cp.getDescription());
        dto.setIsVoided(cp.getIsVoided());
        dto.setCreatedAt(cp.getCreatedAt());
        return dto;
    }
}
