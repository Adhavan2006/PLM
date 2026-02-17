# Mini Project Lifecycle Management System (PLMS)

A comprehensive web application for managing student mini-projects, covering the entire lifecycle from idea proposal to final submission.

## Features

- **Lifecycle Management**: Structured stages (Idea -> Design -> Development -> Testing -> Submission -> Completed).
- **Role-Based Access**: Specialized views for Students, Faculty, and Admins.
- **Approvals**: Faculty approval workflow for stage transitions.
- **Documents**: File upload and versioning.
- **Analytics**: Dashboard with project statistics.
- **Notifications**: Real-time alerts for updates.
- **Modern UI**: Dark-themed, responsive enterprise design.

## Tech Stack

- **Backend**: Java Spring Boot 3, Spring Security, JWT, JPA/Hibernate.
- **Database**: MySQL.
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).

## Setup Instructions

### Prerequisites
- Java 17+
- Maven
- MySQL Server

### Database Setup
1. Create a database named `plms_db`.
2. The application will automatically create tables on first run (`schema.sql`).
3. Default users are populated by `data.sql`:
   - **Admin**: `admin` / `admin123` (Note: Password hash in data.sql is placeholder, register a new one or use a valid BCrypt hash)
   - **Faculty**: `faculty1` / `faculty123`
   - **Student**: `student1` / `student123`

   *Note: For security, register a new user via the UI to ensure the password hash is correct.*

### Running the Backend
1. Navigate to the `backend` directory.
2. Run `mvn spring-boot:run`.
3. The server will start on `http://localhost:8080`.

### Running the Frontend
The frontend is served statically by Spring Boot.
1. Access the application at `http://localhost:8080/index.html`.

## Usage Flow
1. **Student** registers/logs in and creates a Project.
2. **Student** uploads initial proposal document.
3. **Faculty** logs in, views the project, and Approves the "Idea" stage.
4. **Project** moves to "Design" stage.
5. Process repeats until "Completed".
6. **Admin** can view analytics on the dashboard.

## API Documentation
Postman Collection is recommended for testing raw API endpoints at `/api/**`.
