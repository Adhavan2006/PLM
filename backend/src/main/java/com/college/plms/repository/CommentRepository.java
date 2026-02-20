package com.college.plms.repository;

import com.college.plms.model.Comment;
import com.college.plms.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByProject(Project project);
    List<Comment> findByProjectIdOrderByCreatedAtAsc(Long projectId);
}
