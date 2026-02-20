package com.college.plms.controller;

import com.college.plms.model.Approval;
import com.college.plms.model.Document;
import com.college.plms.model.Project;
import com.college.plms.model.User;
import com.college.plms.security.UserDetailsImpl;
import com.college.plms.service.ProjectService;
import com.college.plms.repository.RatingRepository;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createProject(@RequestBody Map<String, String> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User student = userRepository.findById(userDetails.getId()).orElseThrow();
        
        Project project = projectService.createProject(
            payload.get("title"),
            payload.get("description"),
            payload.get("domain"),
            payload.get("stack"),
            payload.get("githubUrl"),
            student
        );
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public List<Project> getAllProjects(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        if (user.getRole().name().equals("ADMIN")) {
            return projectService.getAllProjects();
        } else if (user.getRole().name().equals("FACULTY")) {
            return projectService.getProjectsByFaculty(user);
        } else {
            return projectService.getProjectsByStudent(user);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping("/{id}/upload")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> uploadDocument(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Document document = projectService.uploadDocument(id, file);
        return ResponseEntity.ok(document);
    }
    
    @GetMapping("/{id}/documents")
    public ResponseEntity<List<Document>> getDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectDocuments(id));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        Resource resource = projectService.getDocumentResource(documentId);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/approvals")
    public ResponseEntity<List<Approval>> getApprovals(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectApprovals(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> approveStage(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        projectService.approveStage(id, userDetails.getId(), payload.get("remarks"));
        return ResponseEntity.ok("Stage Approved");
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> rejectStage(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        projectService.rejectStage(id, userDetails.getId(), payload.get("remarks"));
        return ResponseEntity.ok("Stage Rejected");
    }
    
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignFaculty(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        projectService.assignFaculty(id, payload.get("facultyId"));
        return ResponseEntity.ok("Faculty Assigned");
    }
    
    @PostMapping("/{id}/assign-faculty/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignFacultyById(@PathVariable Long id, @PathVariable Long facultyId) {
        projectService.assignFaculty(id, facultyId);
        return ResponseEntity.ok("Faculty Assigned");
    }
    
    @PostMapping("/{id}/request-faculty/{facultyId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> requestFaculty(@PathVariable Long id, @PathVariable Long facultyId) {
        projectService.requestFaculty(id, facultyId);
        return ResponseEntity.ok("Faculty requested successfully");
    }

    @PostMapping("/{id}/accept-faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> acceptFaculty(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        try {
            projectService.acceptFacultyRequest(id, userDetails.getId());
            return ResponseEntity.ok("Faculty request accepted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject-faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> rejectFaculty(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        try {
            projectService.rejectFacultyRequest(id, userDetails.getId());
            return ResponseEntity.ok("Faculty request rejected");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitForReview(@PathVariable Long id) {
        try {
            projectService.submitForReview(id);
            return ResponseEntity.ok("Project submitted for review");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> rateProject(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        projectService.rateProject(id, (Integer)payload.get("rating"), (String)payload.get("feedback"), userDetails.getId());
        return ResponseEntity.ok("Project Rated");
    }

    @GetMapping("/{id}/rating")
    public ResponseEntity<?> getProjectRating(@PathVariable Long id) {
        return ResponseEntity.ok(ratingRepository.findByProjectId(id).orElseThrow());
    }

    @Autowired
    private com.college.plms.repository.TeamInvitationRepository teamInvitationRepository;

    @PostMapping("/{id}/invite")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> sendInvitation(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        try {
            projectService.sendTeamInvitation(id, userDetails.getId(), payload.get("username"));
            return ResponseEntity.ok("Invitation sent successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        System.out.println("DEBUG: deleteProject called for project ID: " + id);
        projectService.deleteProject(id);
        return ResponseEntity.ok(new com.college.plms.payload.response.MessageResponse("Project deleted successfully"));
    }
}
