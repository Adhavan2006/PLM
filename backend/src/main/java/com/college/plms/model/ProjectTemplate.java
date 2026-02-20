package com.college.plms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "project_templates")
public class ProjectTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String domain;

    @Column(columnDefinition = "TEXT")
    private String suggestedStack;

    @Column(columnDefinition = "TEXT")
    private String suggestedTags;

    @Column(columnDefinition = "TEXT")
    private String description;

    public ProjectTemplate() {}

    public ProjectTemplate(String domain, String suggestedStack, String suggestedTags, String description) {
        this.domain = domain;
        this.suggestedStack = suggestedStack;
        this.suggestedTags = suggestedTags;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getSuggestedStack() { return suggestedStack; }
    public void setSuggestedStack(String suggestedStack) { this.suggestedStack = suggestedStack; }
    public String getSuggestedTags() { return suggestedTags; }
    public void setSuggestedTags(String suggestedTags) { this.suggestedTags = suggestedTags; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
