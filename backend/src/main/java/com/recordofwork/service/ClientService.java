package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientService {
    private final ClientRepository clientRepository;
    private final ClientPaymentRepository clientPaymentRepository;
    private final OrganizationRepository organizationRepository;

    public ClientService(ClientRepository clientRepository, ClientPaymentRepository clientPaymentRepository,
                         OrganizationRepository organizationRepository) {
        this.clientRepository = clientRepository;
        this.clientPaymentRepository = clientPaymentRepository;
        this.organizationRepository = organizationRepository;
    }

    public PageResponse<ClientDTO> getAllClients(Long orgId, int page, int size) {
        Page<Client> page1 = clientRepository.findByOrganizationIdAndIsDeletedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    @Transactional
    public ClientDTO createClient(Long orgId, ClientDTO request) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Client client = Client.builder()
            .organization(org).name(request.getName()).phone(request.getPhone())
            .email(request.getEmail()).address(request.getAddress())
            .companyName(request.getCompanyName()).notes(request.getNotes())
            .build();
        return toDTO(clientRepository.save(client));
    }

    @Transactional
    public ClientDTO updateClient(Long id, ClientDTO request) {
        Client client = clientRepository.findById(id).orElseThrow();
        client.setName(request.getName());
        client.setPhone(request.getPhone());
        client.setEmail(request.getEmail());
        client.setAddress(request.getAddress());
        client.setCompanyName(request.getCompanyName());
        client.setNotes(request.getNotes());
        return toDTO(clientRepository.save(client));
    }

    private ClientDTO toDTO(Client client) {
        ClientDTO dto = new ClientDTO();
        dto.setId(client.getId());
        dto.setName(client.getName());
        dto.setPhone(client.getPhone());
        dto.setEmail(client.getEmail());
        dto.setAddress(client.getAddress());
        dto.setCompanyName(client.getCompanyName());
        dto.setNotes(client.getNotes());
        dto.setIsActive(client.getIsActive());
        dto.setTotalReceived(clientPaymentRepository.sumByClient(client.getId()));
        dto.setCreatedAt(client.getCreatedAt());
        return dto;
    }
}
