package com.college.plms.controller;

import com.college.plms.model.ChatMessage;
import com.college.plms.model.Project;
import com.college.plms.model.User;
import com.college.plms.repository.ChatMessageRepository;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.repository.UserRepository;
import com.college.plms.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getMessages(@PathVariable Long projectId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));

        if (!isAuthorized(user, project)) {
            return ResponseEntity.status(403).body("Not authorized to view chat");
        }

        List<ChatMessage> messages = chatMessageRepository.findByProjectOrderByTimestampAsc(project);
        List<Map<String, Object>> response = messages.stream().map(msg -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", msg.getId());
            map.put("content", msg.getContent());
            map.put("sender", msg.getSender().getFullName());
            map.put("senderId", msg.getSender().getId());
            map.put("timestamp", msg.getTimestamp().toString());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@PathVariable Long projectId, @RequestBody Map<String, String> payload, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));

        if (!isAuthorized(user, project)) {
            return ResponseEntity.status(403).body("Not authorized to send messages");
        }

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
             return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        ChatMessage message = new ChatMessage(content, user, project);
        chatMessageRepository.save(message);

        Map<String, String> res = new java.util.HashMap<>();
        res.put("message", "Sent successfully");
        return ResponseEntity.ok(res);
    }

    private boolean isAuthorized(User user, Project project) {
        if (user.getRole().name().equals("ADMIN")) return true;
        
        if (project.getStudent() != null && project.getStudent().getId().equals(user.getId())) return true;
        
        if (project.getFaculty() != null && project.getFaculty().getId().equals(user.getId())) return true;
        
        if (project.getTeamMembers().contains(user)) return true;
        
        return project.getTeamMembers().stream().anyMatch(m -> m.getId().equals(user.getId()));
    }
}
