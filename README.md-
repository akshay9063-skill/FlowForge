# FlowForge — Project and Task Management

FlowForge is a full-stack web application that helps users organize projects and manage their associated tasks through a web dashboard.

## Features

- User registration and login
- Password hashing using BCrypt
- Create, view, update, and delete projects
- Create, view, update, and delete tasks
- Manage task status, priority, descriptions, and due dates
- User-specific project and task access
- REST API integration
- Persistent MariaDB database storage

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Java 21, Spring Boot
- **Database:** MariaDB
- **Data Access:** Spring Data JPA, Hibernate
- **Security:** Spring Security, BCrypt, session-based authentication
- **Tools:** npm, Gradle, Git, GitHub

## Project Structure

```text
FlowForge/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   ├── gradle/
│   └── build.gradle
├── .gitignore
└── README.md
```

## Prerequisites

- Java Development Kit (JDK) 21
- Node.js and npm
- MariaDB or XAMPP with MariaDB
- Git

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/akshay9063-skill/FlowForge.git
cd FlowForge
```

### 2. Create the database

Start MariaDB and open phpMyAdmin. Create the database:

```sql
CREATE DATABASE flowforge;
```

The current local development configuration uses MariaDB on port `3307`. Check `backend/src/main/resources/application.properties` and adjust the connection settings if your environment differs.

### 3. Start the backend

Open a terminal in the project folder and run:

```bat
cd backend
.\gradlew.bat bootRun
```

The backend uses port `8080` by default.

### 4. Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite. The current development setup uses `http://localhost:5173`.

Keep both applications running while using FlowForge.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Check the current user |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/projects` | List the current user's projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/tasks` | List accessible tasks |
| POST | `/api/tasks` | Create a task |

Project and task endpoints also support update and delete operations. Protected endpoints require authentication.

## Security Notes

This project is currently configured for local development. Before public deployment:

- Use secure environment variables for database credentials.
- Enable and correctly configure CSRF protection.
- Restrict CORS to the production frontend domain.
- Use HTTPS and secure session cookies.
- Avoid running the application with database administrator credentials.
- Review input validation, access control, and error handling.
- Configure database backups and production schema migrations.
- Never commit production passwords, API keys, or private data.

## Current Status

The application has been run locally. Basic project and task operations, login, dashboard data loading, and a second-user data-isolation test have been reported as working.

Production security verification and live deployment remain to be completed.

## Future Improvements

- Automated frontend and backend tests
- Improved error handling and validation
- Production deployment
- Continuous integration and deployment
- Enhanced dashboard analytics

## Repository

[FlowForge on GitHub](https://github.com/akshay9063-skill/FlowForge)
