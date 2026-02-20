package com.college.plms.service;

import com.college.plms.model.*;
import com.college.plms.repository.ApprovalRepository;
import com.college.plms.repository.DocumentRepository;
import com.college.plms.repository.GlobalSettingRepository;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.repository.RatingRepository;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.io.Resource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ApprovalRepository approvalRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private GlobalSettingRepository globalSettingRepository;

    @Autowired
    private com.college.plms.repository.ActivityRepository activityRepository;

    public Project createProject(String title, String description, String domain, String techStack, String githubUrl, User student) {
        Project project = new Project();
        project.setTitle(title);
        project.setDescription(description);
        project.setDomain(domain);
        project.setTechStack(techStack);
        project.setGithubUrl(githubUrl);
        project.setStudent(student);
        project.setStage(ProjectStage.IDEA);
        project.setStatus(ProjectStatus.PENDING);
        project.setStageDeadline(calculateDeadline(ProjectStage.IDEA));
        
        Project savedProject = projectRepository.save(project);
        
        // Record Activity
        activityRepository.save(new com.college.plms.model.Activity(savedProject, "Project created with domain: " + domain));
        
        // Notify Student
        notificationService.createNotification(student, "Project '" + title + "' created successfully. Waiting for faculty assignment.");
        
        return savedProject;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectsByStudent(User student) {
        return projectRepository.findByStudentOrTeamMember(student);
    }

    public List<Project> getProjectsByFaculty(User faculty) {
        return projectRepository.findByFaculty(faculty);
    }
    
    public Project getProjectById(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    // Admin assignment (force assign)
    public Project assignFaculty(Long projectId, Long facultyId) {
        Project project = getProjectById(projectId);
        User faculty = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        // Capacity Check
        long activeProjects = projectRepository.findByFaculty(faculty).stream()
                .filter(p -> p.getStage() != ProjectStage.COMPLETED)
                .count();
        if (activeProjects >= faculty.getMaxProjects()) {
            throw new RuntimeException("Faculty member has reached maximum project capacity (" + faculty.getMaxProjects() + ")");
        }

        project.setFaculty(faculty);
        project.setIsFacultyAccepted(true); // Admin moves are auto-accepted
        Project saved = projectRepository.save(project);
        
        notificationService.createNotification(faculty, "You have been assigned to project: " + project.getTitle() + " by Admin.");
        notificationService.createNotification(project.getStudent(), "Faculty " + faculty.getFullName() + " assigned to your project by Admin.");
        
        return saved;
    }

    // Student requests faculty
    public Project requestFaculty(Long projectId, Long facultyId) {
        Project project = getProjectById(projectId);
        User faculty = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));
        
        // Capacity Check
        long activeProjects = projectRepository.findByFaculty(faculty).stream()
                .filter(p -> p.getStage() != ProjectStage.COMPLETED)
                .count();
        if (activeProjects >= faculty.getMaxProjects()) {
            throw new RuntimeException("Faculty member has reached maximum project capacity (" + faculty.getMaxProjects() + ")");
        }

        project.setFaculty(faculty);
        project.setIsFacultyAccepted(false); // Pending acceptance
        Project saved = projectRepository.save(project);
        
        activityRepository.save(new com.college.plms.model.Activity(saved, "Student requested faculty: " + faculty.getFullName()));
        
        notificationService.createNotification(faculty, "Student requested you for project: " + project.getTitle());
        
        return saved;
    }

    // Faculty accepts request
    public Project acceptFacultyRequest(Long projectId, Long facultyId) {
        Project project = getProjectById(projectId);
        
        if (project.getFaculty() == null || !project.getFaculty().getId().equals(facultyId)) {
             throw new RuntimeException("Not authorized or no request found");
        }

        project.setIsFacultyAccepted(true);
        Project saved = projectRepository.save(project);
        
        activityRepository.save(new com.college.plms.model.Activity(saved, "Faculty " + saved.getFaculty().getFullName() + " accepted the request"));

        notificationService.createNotification(project.getStudent(), "Faculty " + project.getFaculty().getFullName() + " accepted your request.");
        
        return saved;
    }

    // Faculty rejects request
    public Project rejectFacultyRequest(Long projectId, Long facultyId) {
        Project project = getProjectById(projectId);
        
        if (project.getFaculty() == null || !project.getFaculty().getId().equals(facultyId)) {
             throw new RuntimeException("Not authorized or no request found");
        }

        project.setFaculty(null); // Unassign faculty
        project.setIsFacultyAccepted(false);
        Project saved = projectRepository.save(project);
        
        notificationService.createNotification(project.getStudent(), "Faculty rejected your request. Please request another faculty.");
        
        return saved;
    }

    @Transactional
    public Document uploadDocument(Long projectId, MultipartFile file) {
        Project project = getProjectById(projectId);
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        
        fileStorageService.store(file, filename);

        Document document = new Document();
        document.setProject(project);
        document.setFilename(file.getOriginalFilename());
        document.setFilePath(filename);
        
        // Simple versioning logic
        List<Document> existingDocs = documentRepository.findByProjectId(projectId);
        document.setVersion(existingDocs.size() + 1);

        Document savedDoc = documentRepository.save(document);
        
        // Notify Faculty
        if(project.getFaculty() != null) {
            notificationService.createNotification(project.getFaculty(), "New document uploaded for project: " + project.getTitle());
        }
        
        return savedDoc;
    }
    
    public List<Document> getProjectDocuments(Long projectId) {
        return documentRepository.findByProjectId(projectId);
    }
    
    @Transactional
    public Project submitForReview(Long projectId) {
        Project project = getProjectById(projectId);
        
        if (project.getFaculty() == null) {
            throw new RuntimeException("Cannot submit: No faculty assigned to this project. Please request a faculty member first.");
        }

        if (!Boolean.TRUE.equals(project.getIsFacultyAccepted())) {
            throw new RuntimeException("Cannot submit: Faculty has not accepted your request yet.");
        }
        
        project.setStatus(ProjectStatus.SUBMITTED);
        Project saved = projectRepository.save(project);
        
        activityRepository.save(new com.college.plms.model.Activity(saved, "Project submitted for review (Stage: " + saved.getStage() + ")"));

        // Notify faculty about submission
        notificationService.createNotification(
            project.getFaculty(), 
            "Project '" + project.getTitle() + "' submitted for review"
        );
        
        return saved;
    }


    @Transactional
    public Project approveStage(Long projectId, Long approverId, String remarks) {
        Project project = getProjectById(projectId);
        User approver = userRepository.findById(approverId).orElseThrow();
        
        // Log Approval
        Approval approval = new Approval();
        approval.setProject(project);
        approval.setApprover(approver);
        approval.setStage(project.getStage());
        approval.setStatus(ProjectStatus.APPROVED);
        approval.setRemarks(remarks);
        approvalRepository.save(approval);
        
        // Move to next stage
        ProjectStage nextStage = getNextStage(project.getStage());
        if (nextStage != null) {
            project.setStage(nextStage);
            project.setStatus(ProjectStatus.PENDING); // Pending approval for new stage
            project.setStageDeadline(calculateDeadline(nextStage));
        } else {
            project.setStatus(ProjectStatus.APPROVED); // Final completion
            project.setStageDeadline(null);
        }

        Project saved = projectRepository.save(project);
        
        activityRepository.save(new com.college.plms.model.Activity(saved, "Stage " + approval.getStage() + " approved. Moved to " + saved.getStage()));

        notificationService.createNotification(project.getStudent(), "Project stage " + approval.getStage() + " approved! Moved to " + project.getStage());
        
        return saved;
    }

    @Transactional
    public Project rejectStage(Long projectId, Long approverId, String remarks) {
        Project project = getProjectById(projectId);
        User approver = userRepository.findById(approverId).orElseThrow();

        // Log Rejection
        Approval approval = new Approval();
        approval.setProject(project);
        approval.setApprover(approver);
        approval.setStage(project.getStage());
        approval.setStatus(ProjectStatus.REJECTED);
        approval.setRemarks(remarks);
        approvalRepository.save(approval);
        
        project.setStatus(ProjectStatus.REJECTED);
        Project saved = projectRepository.save(project);
        
        notificationService.createNotification(project.getStudent(), "Project stage " + approval.getStage() + " rejected. Remarks: " + remarks);
        
        return saved;
    }

    @Transactional
    public Project rateProject(Long projectId, int score, String feedback, Long facultyId) {
        Project project = getProjectById(projectId);
        User faculty = userRepository.findById(facultyId).orElseThrow();
        
        Rating rating = new Rating();
        rating.setProject(project);
        rating.setFaculty(faculty);
        rating.setRating(score);
        rating.setFeedback(feedback);
        ratingRepository.save(rating);
        
        project.setStage(ProjectStage.COMPLETED);
        project.setStatus(ProjectStatus.APPROVED);
        Project saved = projectRepository.save(project);
        
        notificationService.createNotification(project.getStudent(), "Your project '" + project.getTitle() + "' has been rated: " + score + "/5 by " + faculty.getFullName());
        
        return saved;
    }

    public Resource getDocumentResource(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return fileStorageService.loadAsResource(document.getFilePath());
    }

    public List<Approval> getProjectApprovals(Long projectId) {
        return approvalRepository.findByProjectId(projectId);
    }

    private ProjectStage getNextStage(ProjectStage current) {
        switch (current) {
            case IDEA: return ProjectStage.DESIGN;
            case DESIGN: return ProjectStage.DEVELOPMENT;
            case DEVELOPMENT: return ProjectStage.TESTING;
            case TESTING: return ProjectStage.SUBMISSION;
            case SUBMISSION: return ProjectStage.COMPLETED;
            case COMPLETED: return null;
            default: return null;
        }
    }
    
    public LocalDateTime calculateDeadline(ProjectStage stage) {
        LocalDateTime now = LocalDateTime.now();
        String key = "DEADLINE_" + stage.name();
        int days = globalSettingRepository.findBySettingKey(key)
                .map(s -> Integer.parseInt(s.getSettingValue()))
                .orElse(getDefaultDays(stage));
        
        return days > 0 ? now.plusDays(days) : null;
    }

    private int getDefaultDays(ProjectStage stage) {
        switch (stage) {
            case IDEA: return 7;
            case DESIGN: return 14;
            case DEVELOPMENT: return 28;
            case TESTING: return 14;
            case SUBMISSION: return 7;
            default: return 0;
        }
    }

    @Autowired
    private com.college.plms.repository.TeamInvitationRepository teamInvitationRepository;

    @Transactional
    public void sendTeamInvitation(Long projectId, Long requesterId, String usernameOrEmail) {
        Project project = getProjectById(projectId);
        
        // Check if requester is the project owner
        if (!project.getStudent().getId().equals(requesterId)) {
             throw new RuntimeException("Only the project owner can invite team members.");
        }

        // Only allow invitations during IDEA stage
        if (project.getStage() != ProjectStage.IDEA) {
            throw new RuntimeException("Team members can only be invited during the IDEA stage.");
        }

        User invitee = userRepository.findByEmail(usernameOrEmail)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + usernameOrEmail));

        if (!invitee.getRole().name().equals("STUDENT")) {
             throw new RuntimeException("Only students can be invited to the team.");
        }
        
        if (invitee.getId().equals(project.getStudent().getId())) {
             throw new RuntimeException("User is already the project owner.");
        }
        
        if (project.getTeamMembers().contains(invitee)) {
            throw new RuntimeException("User is already in the team.");
        }
        
        // Check for existing pending invitation
        List<TeamInvitation> pending = teamInvitationRepository.findByInviteeAndStatus(invitee, TeamInvitation.InvitationStatus.PENDING);
        boolean alreadyInvited = pending.stream().anyMatch(inv -> inv.getProject().getId().equals(projectId));
        if (alreadyInvited) {
            throw new RuntimeException("User has already been invited.");
        }

        TeamInvitation invitation = new TeamInvitation();
        invitation.setProject(project);
        invitation.setInviter(project.getStudent());
        invitation.setInvitee(invitee);
        teamInvitationRepository.save(invitation);
        
        notificationService.createNotification(invitee, "You have been invited to join project: " + project.getTitle());
    }

    @Transactional
    public void acceptTeamInvitation(Long invitationId, Long userId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        
        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to accept this invitation");
        }

        if (invitation.getStatus() != TeamInvitation.InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation is not pending");
        }

        invitation.setStatus(TeamInvitation.InvitationStatus.ACCEPTED);
        teamInvitationRepository.save(invitation);
        
        Project project = invitation.getProject();
        project.getTeamMembers().add(invitation.getInvitee());
        projectRepository.save(project);

        notificationService.createNotification(project.getStudent(), invitation.getInvitee().getFullName() + " accepted your team invitation.");
    }

    @Transactional
    public void rejectTeamInvitation(Long invitationId, Long userId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        
        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to reject this invitation");
        }

        invitation.setStatus(TeamInvitation.InvitationStatus.REJECTED);
        teamInvitationRepository.save(invitation);
        
        notificationService.createNotification(invitation.getProject().getStudent(), invitation.getInvitee().getFullName() + " rejected your team invitation.");
    }
    
    public List<TeamInvitation> getPendingInvitations(User user) {
        return teamInvitationRepository.findByInviteeAndStatus(user, TeamInvitation.InvitationStatus.PENDING);
    }

    @Transactional
    public void deleteProject(Long projectId) {
        Project project = getProjectById(projectId);
        documentRepository.deleteAll(documentRepository.findByProjectId(projectId));
        activityRepository.deleteAll(activityRepository.findByProjectOrderByCreatedAtDesc(project));
        approvalRepository.deleteAll(approvalRepository.findByProjectId(projectId));
        ratingRepository.findByProjectId(projectId).ifPresent(ratingRepository::delete);
        teamInvitationRepository.deleteAll(teamInvitationRepository.findByProject(project));
        projectRepository.delete(project);
    }
}
