# PLMS Setup Guide

## Prerequisites
- Java 17+
- Maven
- MySQL Server (running)

## Step 1: Configure MySQL

### Option A: Using MySQL Command Line
1. Open MySQL Command Line Client or run:
   ```bash
   mysql -u root -p
   ```

2. Create the database and user:
   ```sql
   CREATE DATABASE IF NOT EXISTS plms_db;
   CREATE USER IF NOT EXISTS 'plms_user'@'localhost' IDENTIFIED BY 'plms_password';
   GRANT ALL PRIVILEGES ON plms_db.* TO 'plms_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Option B: Using Root with No Password
If your MySQL root has no password:
1. The application is already configured for this (empty password)
2. Just ensure MySQL service is running

### Option C: Using Root with Password
If your MySQL root has a password:
1. Edit `backend/src/main/resources/application.properties`
2. Change line 4 to: `spring.datasource.password=YOUR_MYSQL_ROOT_PASSWORD`
3. Rebuild: `mvn clean package -DskipTests`

## Step 2: Verify MySQL Service is Running

### Windows:
```powershell
# Check status
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Start if not running
net start MySQL80  # or your MySQL service name
```

### Linux/Mac:
```bash
# Check status
sudo systemctl status mysql

# Start if not running
sudo systemctl start mysql
```

## Step 3: Build and Run

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   mvn clean package -DskipTests
   ```

3. Run the application:
   ```bash
   java -jar target/plms-0.0.1-SNAPSHOT.jar
   ```

4. Access the application:
   - Open browser to: `http://localhost:8080`

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Your MySQL root password is not empty
- Update `application.properties` with correct password
- Or create a dedicated user (see Option A above)

### Error: "Communications link failure"
- MySQL service is not running
- Start MySQL service (see Step 2)

### Error: "Unknown database 'plms_db'"
- Database not created
- Run the CREATE DATABASE command from Option A

## Default Users

After first run, register users via the UI:
1. Go to `http://localhost:8080`
2. Click "Register"
3. Create accounts for:
   - Student (role: STUDENT)
   - Faculty (role: FACULTY)
   - Admin (role: ADMIN - may need manual DB update)

## Quick Start (If MySQL is already configured)

```bash
cd backend
mvn clean package -DskipTests
java -jar target/plms-0.0.1-SNAPSHOT.jar
```

Then open: `http://localhost:8080`
