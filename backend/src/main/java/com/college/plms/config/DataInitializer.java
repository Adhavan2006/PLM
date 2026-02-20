package com.college.plms.config;

import com.college.plms.model.*;
import com.college.plms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GlobalSettingRepository globalSettingRepository;

    @Autowired
    private ProjectTemplateRepository templateRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Default Admin
        seedAdmin();

        // 2. Seed Global Settings
        seedGlobalSettings();

        // 3. Seed Project Templates
        seedProjectTemplates();
    }

    private void seedAdmin() {
        User admin = userRepository.findByEmail("admin@plm.com").orElse(new User());
        if (admin.getId() == null) {
            admin.setEmail("admin@plm.com");
            admin.setRole(Role.ADMIN);
            admin.setFullName("System Admin");
            admin.setStatus("ACTIVE");
        }
        // Always ensure the password is admin123 as requested
        admin.setPassword(passwordEncoder.encode("admin123"));
        userRepository.save(admin);
        System.out.println("Default Admin seeded/updated: admin@plm.com / admin123");
    }

    private void seedGlobalSettings() {
        if (globalSettingRepository.count() == 0) {
            globalSettingRepository.save(new GlobalSetting("DEADLINE_IDEA", "7"));
            globalSettingRepository.save(new GlobalSetting("DEADLINE_DESIGN", "14"));
            globalSettingRepository.save(new GlobalSetting("DEADLINE_DEVELOPMENT", "28"));
            globalSettingRepository.save(new GlobalSetting("DEADLINE_TESTING", "14"));
            globalSettingRepository.save(new GlobalSetting("DEADLINE_SUBMISSION", "7"));
            System.out.println("Global settings seeded for stage deadlines");
        }
    }

    private void seedProjectTemplates() {
        if (templateRepository.count() == 0) {
            templateRepository.save(new ProjectTemplate(
                "AI/ML", 
                "Python, TensorFlow, Scikit-learn, Jupyter", 
                "AI, ML, DataScience", 
                "A project focused on machine learning models, data analysis, or neural networks."
            ));
            templateRepository.save(new ProjectTemplate(
                "Web Development", 
                "React, Node.js, Express, MongoDB/MySQL", 
                "Web, FullStack, Frontend, Backend", 
                "Building modern web applications with responsive design and interactive features."
            ));
            templateRepository.save(new ProjectTemplate(
                "IoT", 
                "Arduino, Raspberry Pi, MQTT, C++", 
                "IoT, Embedded, Sensors", 
                "Connecting physical devices to the internet for data collection and control."
            ));
            System.out.println("Project templates seeded: AI/ML, Web Development, IoT");
        }
    }
}
