package com.recordofwork.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Set;

@Data
public class CreateUserRequest {
    @NotBlank @Size(min = 3, max = 50) private String username;
    @NotBlank @Size(min = 6) private String password;
    @NotBlank private String firstName;
    private String lastName;
    @NotBlank @Email private String email;
    private String phone;
    private Long organizationId;
    private Set<Long> roleIds;
    private Boolean mustChangePassword = false;
}