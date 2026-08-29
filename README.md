# कामचा हिशोब | Record of Work

A complete production-ready web application that digitizes the traditional Marathi notebook-based daily work management system for construction and daily wage workers.

## Features

- **Multi-language**: Marathi (default) + English
- **Dark/Light Theme**: Professional modern UI
- **Responsive Design**: Works on Desktop, Tablet, and Mobile
- **Role-Based Access**: Super Admin, Admin, Supervisor, Worker
- **JWT Authentication**: Secure token-based auth
- **Real-time Calculations**: BigDecimal-based financial calculations

## Modules

- Worker Management
- Project Management
- Daily Attendance (Notebook View)
- Wage Calculation
- Advances (Uchal)
- Worker Payments
- Client Payments
- Expense Management
- Worker Ledger
- Project Ledger
- Cash Ledger
- Daily Closing
- Monthly Settlement
- Reports
- Notifications
- Audit Logs

## Requirements

### Backend
- Java 21+
- Maven 3.8+
- MySQL 8.0+

### Frontend
- Node.js 18+
- npm 9+

## Quick Start

### 1. Database Setup

```sql
CREATE DATABASE IF NOT EXISTS record_of_work
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Update `backend/src/main/resources/application.yml` with your MySQL credentials.

### 2. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on: http://localhost:8080/api

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | superadmin | admin123 |
| Admin | admin | admin123 |
| Supervisor | supervisor1 | admin123 |
| Worker | worker1 | admin123 |

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=record_of_work
DB_USERNAME=root
DB_PASSWORD=Avi6855#
JWT_SECRET=your-secret-key-here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## API Documentation

Swagger UI available at: http://localhost:8080/api/swagger-ui/index.html

## Project Structure

```
record-of-work/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/recordofwork/
│   │   ├── config/            # Security, CORS config
│   │   ├── controller/        # REST controllers
│   │   ├── dto/               # Data transfer objects
│   │   ├── entity/            # JPA entities
│   │   ├── exception/         # Global exception handler
│   │   ├── mapper/            # DTO mappers
│   │   ├── repository/        # Spring Data repositories
│   │   ├── security/          # JWT, auth filters
│   │   └── service/           # Business logic
│   └── src/main/resources/
│       ├── application.yml    # App configuration
│       └── db/migration/      # Flyway migrations
├── frontend/                   # Next.js frontend
│   └── src/
│       ├── app/               # Pages and layouts
│       ├── components/        # Reusable components
│       │   ├── layout/        # Sidebar, Header, AppShell
│       │   └── ui/            # Button, Card, Modal, etc.
│       └── lib/               # API, i18n, store, utils
├── README.md
└── .env.example
```

## Business Workflow

```
Admin Creates Project → Assigns Workers
        ↓
Supervisor Marks Daily Attendance
        ↓
System Calculates Wages
        ↓
Worker May Receive Advance
        ↓
Admin Records Payment
        ↓
Project Expenses Recorded
        ↓
Client Payments Recorded
        ↓
Daily Closing
        ↓
Monthly Settlement
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | Java 21, Spring Boot 3.3 |
| Database | MySQL 8.0 |
| ORM | Hibernate, Spring Data JPA |
| Migrations | Flyway |
| Auth | JWT, Spring Security |
| Build | Maven (backend), npm (frontend) |

## License

Private - All rights reserved.
