
package com.example.demo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    public AuthController(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder,
            SecurityContextRepository securityContextRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
    }

    public record RegisterRequest(
            String name,
            String email,
            String password) {
    }

    public record LoginRequest(
            String email,
            String password) {
    }

    public record UserResponse(
            Long id,
            String name,
            String email) {
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody(required = false) RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (request == null
                || request.name() == null
                || request.name().isBlank()
                || request.email() == null
                || request.email().isBlank()
                || request.password() == null
                || request.password().length() < 8) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Enter your name, email, and a password of at least 8 characters."));
        }

        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Enter a valid email address."));
        }

        if (name.length() > 100 || email.length() > 254) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Name or email is too long."));
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "message",
                            "An account with this email already exists."));
        }

        AppUser user = new AppUser(
                name,
                email,
                passwordEncoder.encode(request.password()));

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "message",
                            "An account with this email already exists."));
        }

        authenticateUser(user, httpRequest, httpResponse);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new UserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail()));
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody(required = false) LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (request == null
                || request.email() == null
                || request.email().isBlank()
                || request.password() == null) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email and password are required."));
        }

        Optional<AppUser> result =
                userRepository.findByEmailIgnoreCase(
                        request.email().trim());

        if (result.isEmpty()
                || !passwordEncoder.matches(
                        request.password(),
                        result.get().getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password."));
        }

        AppUser user = result.get();

        // Rotate the session ID to reduce session-fixation risk.
        HttpSession existingSession = httpRequest.getSession(false);

        if (existingSession != null) {
            existingSession.invalidate();
        }

        authenticateUser(user, httpRequest, httpResponse);

        return ResponseEntity.ok(
                new UserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail()));
    }

    // CURRENT LOGGED-IN USER
    @GetMapping("/me")
    public ResponseEntity<?> me() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Please log in."));
        }

        return userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .<ResponseEntity<?>>map(user ->
                        ResponseEntity.ok(
                                new UserResponse(
                                        user.getId(),
                                        user.getName(),
                                        user.getEmail())))
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                                Map.of("message", "User account not found.")));
    }

    // LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully."));
    }

    // CREATE AND SAVE AUTHENTICATED SESSION
    private void authenticateUser(
            AppUser user,
            HttpServletRequest request,
            HttpServletResponse response) {

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(
                context, request, response);
    }
}
