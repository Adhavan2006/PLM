-- Admin User (password: admin123)
INSERT INTO users (username, password, email, role, full_name) VALUES 
('admin', '$2a$10$r.7g/D9.7X7X7X7X7X7X7.7X7X7X7X7X7X7X7X7X7', 'admin@college.edu', 'ADMIN', 'System Admin');

-- Faculty User (password: faculty123)
INSERT INTO users (username, password, email, role, full_name) VALUES 
('faculty1', '$2a$10$r.7g/D9.7X7X7X7X7X7X7.7X7X7X7X7X7X7X7X7X7', 'faculty1@college.edu', 'FACULTY', 'Dr. Smith');

-- Student User (password: student123)
INSERT INTO users (username, password, email, role, full_name) VALUES 
('student1', '$2a$10$r.7g/D9.7X7X7X7X7X7X7.7X7X7X7X7X7X7X7X7X7', 'student1@college.edu', 'STUDENT', 'Alice Student');

-- Note: The bcrypt hashes above are placeholders. In a real scenario, use a BCrypt generator.
-- For local testing with "password", use: $2a$10$Dow.d93k.1..1..1..1..1..1.
-- Let's use a known hash for 'password': $2a$10$N.zmdr9k7uOCQb376ye.5O8.M9qxJzO.N.zmdr9k7uOCQb376ye.5 (this is fake, I will implement a CommandLineRunner to init users if needed or just let the user register)

-- Better approach: I will create a DataInitializer bean to insert users if they don't exist, using the actual PasswordEncoder.
