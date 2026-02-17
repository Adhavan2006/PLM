package com.college.plms.repository;

import com.college.plms.model.Project;
import com.college.plms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStudent(User student);
    List<Project> findByFaculty(User faculty);
}
