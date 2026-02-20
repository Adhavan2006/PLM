package com.college.plms.controller;

import com.college.plms.model.TeamInvitation;
import com.college.plms.model.User;
import com.college.plms.security.UserDetailsImpl;
import com.college.plms.service.ProjectService;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TeamInvitationController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingInvitations(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        return ResponseEntity.ok(projectService.getPendingInvitations(user));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        try {
            projectService.acceptTeamInvitation(id, userDetails.getId());
            return ResponseEntity.ok("Invitation accepted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        try {
            projectService.rejectTeamInvitation(id, userDetails.getId());
            return ResponseEntity.ok("Invitation rejected");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
