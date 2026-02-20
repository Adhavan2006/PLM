package com.college.plms.controller;

import java.util.List;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.college.plms.model.Role;
import com.college.plms.model.User;
import com.college.plms.payload.request.FacultyCreateRequest;
import com.college.plms.payload.request.SignupRequest;
import com.college.plms.payload.response.MessageResponse;
import com.college.plms.repository.UserRepository;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.repository.ActivityRepository;
import java.time.LocalDateTime;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    ActivityRepository activityRepository;

    @Autowired
    PasswordEncoder encoder;

    @PostMapping("/create-faculty")
    public ResponseEntity<?> createFaculty(@Valid @RequestBody FacultyCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(Role.FACULTY);
        user.setDepartment(request.getDepartment());
        user.setSpecialization(request.getSpecialization());
        user.setMaxProjects(request.getMaxProjects() != null ? request.getMaxProjects() : 5);
        user.setStatus("ACTIVE");

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Faculty account created successfully!"));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(Role.ADMIN);
        user.setStatus("ACTIVE");

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Admin account created successfully!"));
    }

    @GetMapping("/faculty")
    public ResponseEntity<?> getAllFaculty() {
        List<User> faculty = userRepository.findByRole(Role.FACULTY);
        List<Map<String, Object>> response = faculty.stream().map(f -> {
            long count = projectRepository.findByFaculty(f).stream()
                    .filter(p -> p.getStage() != com.college.plms.model.ProjectStage.COMPLETED)
                    .count();
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", f.getId());
            map.put("fullName", f.getFullName());
            map.put("email", f.getEmail());
            map.put("department", f.getDepartment());
            map.put("maxProjects", f.getMaxProjects());
            map.put("currentProjects", count);
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/projects/{id}/deadline")
    public ResponseEntity<?> setProjectDeadline(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        com.college.plms.model.Project project = projectRepository.findById(id).orElseThrow();
        String deadlineStr = payload.get("deadline");
        if (deadlineStr != null) {
             project.setStageDeadline(LocalDateTime.parse(deadlineStr));
             projectRepository.save(project);
             activityRepository.save(new com.college.plms.model.Activity(project, "Admin set deadline to: " + deadlineStr));
        }
        return ResponseEntity.ok(new MessageResponse("Deadline updated"));
    }

    @PostMapping("/faculty/{id}/capacity")
    public ResponseEntity<?> updateFacultyCapacity(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        User user = userRepository.findById(id).orElseThrow();
        if (payload.containsKey("capacity")) {
            user.setMaxProjects(payload.get("capacity"));
            userRepository.save(user);
        }
        return ResponseEntity.ok(new MessageResponse("Capacity updated"));
    }
}
