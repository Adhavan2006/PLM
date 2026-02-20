package com.college.plms.controller;

import com.college.plms.model.ProjectTemplate;
import com.college.plms.repository.ProjectTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
public class ProjectTemplateController {

    @Autowired
    private ProjectTemplateRepository templateRepository;

    @GetMapping
    public List<ProjectTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    @GetMapping("/{domain}")
    public ProjectTemplate getTemplateByDomain(@PathVariable String domain) {
        return templateRepository.findByDomain(domain).orElse(null);
    }
}
