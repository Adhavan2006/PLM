package com.college.plms.controller;

import com.college.plms.model.Comment;
import com.college.plms.model.Project;
import com.college.plms.model.User;
import com.college.plms.repository.CommentRepository;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/comments")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public List<Comment> getComments(@PathVariable Long projectId) {
        return commentRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addComment(@PathVariable Long projectId, @RequestBody Map<String, String> payload, Authentication authentication) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = new User();
        user.setId(userDetails.getId()); // Simplification, assuming only ID is needed for relationship

        Comment comment = new Comment();
        comment.setProject(project);
        comment.setUser(user);
        comment.setContent(payload.get("content"));
        
        commentRepository.save(comment);
        
        return ResponseEntity.ok("Comment added successfully");
    }
}
