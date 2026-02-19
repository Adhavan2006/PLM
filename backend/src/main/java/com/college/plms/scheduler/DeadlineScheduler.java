package com.college.plms.scheduler;

import com.college.plms.model.Project;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DeadlineScheduler {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationService notificationService;

    // Run every day at 9 AM
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrowEnd = now.plusDays(2); // Check deadlines within next 48 hours

        List<Project> dueProjects = projectRepository.findByStageDeadlineBetween(now, tomorrowEnd);

        for (Project project : dueProjects) {
            String message = "Reminder: The deadline for stage '" + project.getStage() + "' is approaching on " + 
                             project.getStageDeadline().toLocalDate();
            
            notificationService.createNotification(project.getStudent(), message);
            
            // Notify team members as well
            project.getTeamMembers().forEach(member -> 
                notificationService.createNotification(member, message + " (Project: " + project.getTitle() + ")")
            );
        }
    }
}
