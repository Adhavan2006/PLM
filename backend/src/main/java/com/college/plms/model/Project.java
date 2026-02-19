package com.college.plms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    private ProjectStage stage;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ProjectStatus status = ProjectStatus.PENDING;

    @Column(name = "stage_deadline")
    private LocalDateTime stageDeadline;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private User faculty;

    @Column(columnDefinition = "boolean default false")
    private Boolean isFacultyAccepted = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "project_team",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> teamMembers = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void setLastUpdate() {  this.updatedAt = LocalDateTime.now(); }

    public Project() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public ProjectStage getStage() { return stage; }
    public void setStage(ProjectStage stage) { this.stage = stage; }
    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }
    public LocalDateTime getStageDeadline() { return stageDeadline; }
    public void setStageDeadline(LocalDateTime stageDeadline) { this.stageDeadline = stageDeadline; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public User getFaculty() { return faculty; }
    public void setFaculty(User faculty) { this.faculty = faculty; }
    public Boolean getIsFacultyAccepted() { return isFacultyAccepted; }
    public void setIsFacultyAccepted(Boolean isFacultyAccepted) { this.isFacultyAccepted = isFacultyAccepted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Set<User> getTeamMembers() { return teamMembers; }
    public void setTeamMembers(Set<User> teamMembers) { this.teamMembers = teamMembers; }
}
