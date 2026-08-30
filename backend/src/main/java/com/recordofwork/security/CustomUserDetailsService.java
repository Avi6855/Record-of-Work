package com.recordofwork.security;

import com.recordofwork.entity.User;
import com.recordofwork.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("Account is deactivated");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getIsActive(),
                true, true, true,
                user.getRoles().stream()
                        .flatMap(role -> {
                            var authorities = role.getPermissions().stream()
                                    .map(permission -> new SimpleGrantedAuthority(permission.getName()))
                                    .collect(Collectors.toList());
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                            return authorities.stream();
                        })
                        .collect(Collectors.toList())
        );
    }
}
