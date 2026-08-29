package com.recordofwork.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDTOs {
    
    @Data
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }
    
    @Data
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private UserDTO user;
    }
    
    @Data
    public static class RefreshTokenRequest {
        @NotBlank private String refreshToken;
    }
    
    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank private String newPassword;
        @NotBlank private String confirmPassword;
    }
    
    @Data
    public static class ResetPasswordRequest {
        @NotBlank private String username;
        @NotBlank private String email;
    }
}