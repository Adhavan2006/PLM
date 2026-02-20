---
description: how to run the PLMS project
---
// turbo-all
# Running the PLMS Application

Follow these steps to set up and run the Mini Project Lifecycle Management System (PLMS).

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- MySQL Server 8.0+

### 1. Database Setup
Ensure MySQL is running and accessible with the credentials specified in `application.properties`:
- **DB Name**: `plms_db` (automatically created)
- **Username**: `root`
- **Password**: `root`

### 2. Build the Application
```powershell
cd d:\PLM\backend
mvn clean package -DskipTests
```

### 3. Run the Application
```powershell
java -jar target/plms-0.0.1-SNAPSHOT.jar
```

### 4. Verification
Once the server starts, open your browser and navigate to:
- **URL**: [http://localhost:8080](http://localhost:8080)
- **Admin Login**: `admin` / `admin123`
- **Student Login**: `student` / `password`
- **Faculty Login**: `faculty` / `password`
