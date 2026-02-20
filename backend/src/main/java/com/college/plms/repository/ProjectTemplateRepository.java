package com.college.plms.repository;

import com.college.plms.model.ProjectTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProjectTemplateRepository extends JpaRepository<ProjectTemplate, Long> {
    Optional<ProjectTemplate> findByDomain(String domain);
}
