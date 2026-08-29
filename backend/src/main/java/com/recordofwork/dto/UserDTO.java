package com.recordofwork.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Long organizationId;
    private String organizationName;
    private Set<String> roles;
    private Boolean isActive;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}