package com.college.plms.service;

import com.college.plms.model.*;
import com.college.plms.repository.ApprovalRepository;
import com.college.plms.repository.DocumentRepository;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.repository.RatingRepository;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

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

    public Project createProject(String title, String description, String domain, User student) {
        Project project = new Project();
        project.setTitle(title);
        project.setDescription(description);
        project.setDomain(domain);
        project.setStudent(student);
        project.setStage(ProjectStage.IDEA);
        project.setStatus(ProjectStatus.PENDING);
        
        Project savedProject = projectRepository.save(project);
        
        // Notify Student
        notificationService.createNotification(student, "Project '" + title + "' created successfully. Waiting for faculty assignment.");
        
        return savedProject;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectsByStudent(User student) {
        return projectRepository.findByStudent(student);
    }

    public List<Project> getProjectsByFaculty(User faculty) {
        return projectRepository.findByFaculty(faculty);
    }
    
    public Project getProjectById(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project assignFaculty(Long projectId, Long facultyId) {
        Project project = getProjectById(projectId);
        User faculty = userRepository.findById(facultyId).orElseThrow(() -> new RuntimeException("Faculty not found"));
        project.setFaculty(faculty);
        Project saved = projectRepository.save(project);
        
        notificationService.createNotification(faculty, "You have been assigned to project: " + project.getTitle());
        notificationService.createNotification(project.getStudent(), "Faculty " + faculty.getFullName() + " assigned to your project.");
        
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
            throw new RuntimeException("Cannot submit: No faculty assigned to this project");
        }
        
        project.setStatus(ProjectStatus.SUBMITTED);
        Project saved = projectRepository.save(project);
        
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
        } else {
            project.setStatus(ProjectStatus.APPROVED); // Final completion
        }

        Project saved = projectRepository.save(project);
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
}
