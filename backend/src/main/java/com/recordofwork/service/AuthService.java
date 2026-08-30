package com.recordofwork.service;

import com.recordofwork.dto.AuthDTOs.*;
import com.recordofwork.dto.UserDTO;
import com.recordofwork.entity.*;
import com.recordofwork.repository.*;
import com.recordofwork.security.JwtTokenProvider;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginHistoryRepository loginHistoryRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider,
                       UserRepository userRepository, PasswordEncoder passwordEncoder,
                       LoginHistoryRepository loginHistoryRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginHistoryRepository = loginHistoryRepository;
    }

    public LoginResponse login(LoginRequest request, String ip, String userAgent) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            User user = userRepository.findByUsernameAndIsDeletedFalse(request.getUsername()).orElseThrow();
            user.setLastLogin(java.time.LocalDateTime.now());
            userRepository.save(user);

            LoginHistory loginHistory = LoginHistory.builder()
                .user(user).ipAddress(ip).userAgent(userAgent).isSuccess(true).build();
            loginHistoryRepository.save(loginHistory);

            LoginResponse response = new LoginResponse();
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setUser(toUserDTO(user));
            return response;
        } catch (BadCredentialsException e) {
            User user = userRepository.findByUsernameAndIsDeletedFalse(request.getUsername()).orElse(null);
            if (user != null) {
                LoginHistory loginHistory = LoginHistory.builder()
                    .user(user).ipAddress(ip).userAgent(userAgent).isSuccess(false)
                    .failureReason("Bad credentials").build();
                loginHistoryRepository.save(loginHistory);
            }
            throw e;
        }
    }

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("Invalid refresh token");
        }
        String username = tokenProvider.getUsernameFromToken(request.getRefreshToken());
        String newAccessToken = tokenProvider.generateAccessToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);
        User user = userRepository.findByUsernameAndIsDeletedFalse(username).orElseThrow();

        LoginResponse response = new LoginResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setUser(toUserDTO(user));
        return response;
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userRepository.findByUsernameAndIsDeletedFalse(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsernameAndIsDeletedFalse(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        if (user.getOrganization() != null) {
            dto.setOrganizationId(user.getOrganization().getId());
            dto.setOrganizationName(user.getOrganization().getName());
        }
        dto.setRoles(user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet()));
        dto.setIsActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
