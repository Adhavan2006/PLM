package com.college.plms.component;

import com.college.plms.model.Role;
import com.college.plms.model.User;
import com.college.plms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        createIfNotFound("admin@plm.com", "admin", "Admin@PLM#2026", "System Admin", Role.ADMIN);
        createIfNotFound("faculty1@plm.com", "faculty1", "Faculty@PLM#2026", "Dr. Smith", Role.FACULTY);
        createIfNotFound("student1@plm.com", "student1", "Student@PLM#2026", "Alice Student", Role.STUDENT);
        System.out.println("Data initialization complete.");
    }

    private void createIfNotFound(String email, String username, String password, String fullName, Role role) {
        User user = userRepository.findByEmail(email).orElse(new User());
        if (user.getId() == null) {
            user.setEmail(email);
            user.setUsername(username);
            user.setFullName(fullName);
            user.setRole(role);
            user.setStatus("ACTIVE");
        }
        // Always update password for seed accounts to ensure security best practices / remove warnings
        user.setPassword(encoder.encode(password));
        userRepository.save(user);
        System.out.println("Initialized " + role + " user: " + email + " / " + password);
    }
}
