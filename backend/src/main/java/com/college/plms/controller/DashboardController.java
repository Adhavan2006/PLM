package com.college.plms.controller;

import com.college.plms.model.ProjectStage;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getDashboardStats() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.college.plms.model.User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<com.college.plms.model.Project> projects;

        if (user.getRole() == com.college.plms.model.Role.ADMIN) {
            projects = projectRepository.findAll();
        } else if (user.getRole() == com.college.plms.model.Role.FACULTY) {
            projects = projectRepository.findByFaculty(user);
        } else {
            // Student
            projects = projectRepository.findByStudentOrTeamMember(user);
        }

        Map<String, Object> stats = new HashMap<>();
        
        long totalProjects = projects.size();
        long completedProjects = projects.stream()
                .filter(p -> p.getStage() == ProjectStage.COMPLETED).count();
        long activeProjects = totalProjects - completedProjects;
        
        stats.put("totalProjects", totalProjects);
        stats.put("activeProjects", activeProjects);
        stats.put("completedProjects", completedProjects);
        
        // Total Users - Only relevant for Admin
        if (user.getRole() == com.college.plms.model.Role.ADMIN) {
            stats.put("totalUsers", userRepository.count());
        } else {
            stats.put("totalUsers", 0); // Or strict hiding in frontend
        }
        
        // Projects by Stage
        Map<String, Long> projectsByStage = new HashMap<>();
        for (ProjectStage stage : ProjectStage.values()) {
            long count = projects.stream().filter(p -> p.getStage() == stage).count();
            projectsByStage.put(stage.name(), count);
        }
        stats.put("projectsByStage", projectsByStage);

        // Projects by Domain
        Map<String, Long> projectsByDomain = new HashMap<>();
        projects.forEach(p -> {
            String domain = p.getDomain();
            if (domain == null || domain.isEmpty()) domain = "Unknown";
            projectsByDomain.put(domain, projectsByDomain.getOrDefault(domain, 0L) + 1);
        });
        stats.put("projectsByDomain", projectsByDomain);

        // Faculty Load - Admin sees all, Faculty sees self, Student sees nothing/relevant
        Map<String, Long> facultyLoad = new HashMap<>();
        if (user.getRole() == com.college.plms.model.Role.ADMIN) {
            userRepository.findByRole(com.college.plms.model.Role.FACULTY).forEach(f -> {
                long count = projectRepository.findByFaculty(f).stream()
                        .filter(p -> p.getStage() != ProjectStage.COMPLETED)
                        .count();
                facultyLoad.put(f.getFullName(), count);
            });
        } else if (user.getRole() == com.college.plms.model.Role.FACULTY) {
             long count = projects.stream().filter(p -> p.getStage() != ProjectStage.COMPLETED).count();
             facultyLoad.put(user.getFullName(), count);
        }
        stats.put("facultyLoad", facultyLoad);

        return ResponseEntity.ok(stats);
    }
}
