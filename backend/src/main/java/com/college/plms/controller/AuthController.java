package com.college.plms.controller;

import java.util.List;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.college.plms.model.Role;
import com.college.plms.model.User;
import com.college.plms.payload.request.LoginRequest;
import com.college.plms.payload.request.SignupRequest;
import com.college.plms.payload.response.JwtResponse;
import com.college.plms.payload.response.MessageResponse;
import com.college.plms.repository.UserRepository;
import com.college.plms.security.JwtUtils;
import com.college.plms.security.UserDetailsImpl;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getEmail(), 
                                                 role,
                                                 user.getFullName()));
    }

    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        if (!signUpRequest.getPassword().equals(signUpRequest.getConfirmPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Passwords do not match!"));
        }

        // Create new student account
        User user = new User();
        user.setEmail(signUpRequest.getEmail());
        user.setFullName(signUpRequest.getFullName());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setRole(Role.STUDENT);
        user.setStatus("ACTIVE");
        
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Student registered successfully!"));
    }

    @org.springframework.web.bind.annotation.GetMapping("/diagnose")
    public ResponseEntity<?> diagnoseSystem() {
        java.util.Map<String, Object> status = new java.util.HashMap<>();
        try {
            com.college.plms.model.User admin = userRepository.findByEmail("admin@plm.com").orElse(null);
            status.put("adminUser", admin);
            status.put("adminRole", admin != null ? admin.getRole() : "NULL");
            status.put("totalUsers", userRepository.count());
            try {
                java.util.Map<Object, Long> roles = userRepository.findAll().stream()
                    .collect(java.util.stream.Collectors.groupingBy(com.college.plms.model.User::getRole, java.util.stream.Collectors.counting()));
                status.put("rolesDistribution", roles);
            } catch (Exception ex) {
                status.put("rolesError", ex.getMessage());
            }
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("error", e.getMessage());
            if (e.getStackTrace().length > 0) status.put("trace", e.getStackTrace()[0].toString());
            return ResponseEntity.ok(status);
        }
    }
}
