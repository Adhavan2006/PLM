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
        Map<String, Object> stats = new HashMap<>();
        
        long totalProjects = projectRepository.count();
        long completedProjects = projectRepository.findAll().stream()
                .filter(p -> p.getStage() == ProjectStage.COMPLETED).count();
        long activeProjects = totalProjects - completedProjects;
        
        stats.put("totalProjects", totalProjects);
        stats.put("activeProjects", activeProjects);
        stats.put("completedProjects", completedProjects);
        stats.put("totalUsers", userRepository.count());
        
        // Projects by Stage
        Map<String, Long> projectsByStage = new HashMap<>();
        for (ProjectStage stage : ProjectStage.values()) {
            long count = projectRepository.findAll().stream()
                .filter(p -> p.getStage() == stage).count();
            projectsByStage.put(stage.name(), count);
        }
        stats.put("projectsByStage", projectsByStage);

        // Projects by Domain
        Map<String, Long> projectsByDomain = new HashMap<>();
        projectRepository.findAll().forEach(p -> {
            String domain = p.getDomain();
            if (domain == null || domain.isEmpty()) domain = "Unknown";
            projectsByDomain.put(domain, projectsByDomain.getOrDefault(domain, 0L) + 1);
        });
        stats.put("projectsByDomain", projectsByDomain);

        return ResponseEntity.ok(stats);
    }
}
