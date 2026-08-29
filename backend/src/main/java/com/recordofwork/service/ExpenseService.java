package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;

    public ExpenseService(ExpenseRepository expenseRepository, OrganizationRepository organizationRepository,
                          ProjectRepository projectRepository) {
        this.expenseRepository = expenseRepository;
        this.organizationRepository = organizationRepository;
        this.projectRepository = projectRepository;
    }

    public PageResponse<ExpenseDTO> getAllExpenses(Long orgId, int page, int size) {
        Page<Expense> page1 = expenseRepository.findByOrganizationIdAndIsVoidedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    @Transactional
    public ExpenseDTO createExpense(Long orgId, CreateExpenseRequest request) {
        Organization org = organizationRepository.findById(orgId).orElseThrow();
        Expense expense = Expense.builder()
            .organization(org)
            .category(Expense.ExpenseCategory.valueOf(request.getCategory()))
            .amount(request.getAmount()).expenseDate(request.getExpenseDate())
            .description(request.getDescription()).vendor(request.getVendor())
            .vendorPhone(request.getVendorPhone())
            .paymentMethod(Expense.PaymentMethod.valueOf(request.getPaymentMethod()))
            .notes(request.getNotes())
            .build();
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId()).orElseThrow();
            expense.setProject(project);
        }
        return toDTO(expenseRepository.save(expense));
    }

    @Transactional
    public void voidExpense(Long id, Long userId, String reason) {
        Expense expense = expenseRepository.findById(id).orElseThrow();
        expense.setIsVoided(true);
        expense.setVoidedBy(userId);
        expense.setVoidReason(reason);
        expense.setVoidedAt(java.time.LocalDateTime.now());
        expenseRepository.save(expense);
    }

    public ExpenseDTO toDTO(Expense e) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(e.getId());
        dto.setCategory(e.getCategory().name());
        dto.setAmount(e.getAmount());
        dto.setExpenseDate(e.getExpenseDate());
        dto.setDescription(e.getDescription());
        dto.setVendor(e.getVendor());
        dto.setPaymentMethod(e.getPaymentMethod().name());
        dto.setNotes(e.getNotes());
        dto.setIsVoided(e.getIsVoided());
        dto.setCreatedAt(e.getCreatedAt());
        if (e.getProject() != null) {
            dto.setProjectId(e.getProject().getId());
            dto.setProjectName(e.getProject().getName());
        }
        return dto;
    }
}
