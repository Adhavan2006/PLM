package com.college.plms.controller;

import com.college.plms.model.Activity;
import com.college.plms.model.Project;
import com.college.plms.repository.ActivityRepository;
import com.college.plms.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping("/{projectId}")
    public List<Activity> getProjectActivities(@PathVariable Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        return activityRepository.findByProjectOrderByCreatedAtDesc(project);
    }
}
