package com.college.plms.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.college.plms.model.Role;
import com.college.plms.model.User;
import com.college.plms.repository.UserRepository;
import com.college.plms.repository.ProjectRepository;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ProjectRepository projectRepository;

    @GetMapping("/faculty")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'FACULTY')")
    public ResponseEntity<?> getAllFaculty() {
        List<User> faculty = userRepository.findByRole(Role.FACULTY);
        List<Map<String, Object>> response = faculty.stream().map(f -> {
            long count = projectRepository.findByFaculty(f).stream()
                    .filter(p -> p.getStage() != com.college.plms.model.ProjectStage.COMPLETED)
                    .count();
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("fullName", f.getFullName());
            map.put("email", f.getEmail());
            map.put("department", f.getDepartment());
            map.put("maxProjects", f.getMaxProjects());
            map.put("currentProjects", count);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
