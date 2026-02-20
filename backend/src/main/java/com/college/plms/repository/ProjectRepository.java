package com.college.plms.repository;

import com.college.plms.model.Project;
import com.college.plms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStudent(User student);
    List<Project> findByFaculty(User faculty);
    
    @Query("SELECT p FROM Project p WHERE p.student = :user OR :user MEMBER OF p.teamMembers")
    List<Project> findByStudentOrTeamMember(@Param("user") User user);
    
    List<Project> findByStageDeadlineBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByStage(com.college.plms.model.ProjectStage stage);
}
