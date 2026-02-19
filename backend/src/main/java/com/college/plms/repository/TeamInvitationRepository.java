package com.college.plms.repository;

import com.college.plms.model.TeamInvitation;
import com.college.plms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {
    List<TeamInvitation> findByInviteeAndStatus(User invitee, TeamInvitation.InvitationStatus status);
    List<TeamInvitation> findByProject(com.college.plms.model.Project project);
}
