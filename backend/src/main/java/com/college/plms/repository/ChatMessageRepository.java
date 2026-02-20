package com.college.plms.repository;

import com.college.plms.model.ChatMessage;
import com.college.plms.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectOrderByTimestampAsc(Project project);
}
