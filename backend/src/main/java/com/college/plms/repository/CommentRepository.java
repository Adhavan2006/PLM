package com.college.plms.repository;

import com.college.plms.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByProjectIdOrderByCreatedAtAsc(Long projectId);
}
