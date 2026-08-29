package com.recordofwork.service;

import com.recordofwork.dto.*;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public PageResponse<UserDTO> getAllUsers(int page, int size) {
        Page<User> page1 = userRepository.findByDeletedFalse(PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    public PageResponse<UserDTO> getUsersByOrganization(Long orgId, int page, int size) {
        Page<User> page1 = userRepository.findByOrganizationIdAndDeletedFalse(orgId, PageRequest.of(page, size));
        return PageResponse.of(page1.map(this::toDTO));
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.existsByUsernameAndDeletedFalse(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName()).lastName(request.getLastName())
            .email(request.getEmail()).phone(request.getPhone())
            .mustChangePassword(request.getMustChangePassword())
            .build();
        if (request.getOrganizationId() != null) {
            Organization org = new Organization();
            org.setId(request.getOrganizationId());
            user.setOrganization(org);
        }
        if (request.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id).orElseThrow();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        if (request.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }
        return toDTO(userRepository.save(user));
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        if (user.getOrganization() != null) {
            dto.setOrganizationId(user.getOrganization().getId());
            dto.setOrganizationName(user.getOrganization().getName());
        }
        dto.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()));
        return dto;
    }
}
