# Project Management System

A professional, full-stack Project Management System designed to streamline team collaboration, task tracking, and project delivery.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Project Management System (PMS) is an end-to-end solution for managing projects, tasks, and teams. It offers robust features for planning, execution, and monitoring, empowering organizations to achieve their goals efficiently.

## Features

- Create, update, and manage projects
- Assign and track tasks for team members
- Manage team roles and permissions
- Monitor progress with dashboards and reports
- Seamless integration between backend and frontend
- Secure authentication and authorization

## Technology Stack

- **Frontend:** React.js
- **Backend:** C# with .NET
- **Database:** Microsoft SQL Server
- **Version Control:** Git & GitHub

## Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) installed
- [Node.js & npm](https://nodejs.org/) installed
- Microsoft SQL Server instance

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tanujapujari/Project-Management-System.git
   cd Project-Management-System
   ```

2. **Backend Setup (`PMS-backend`):**
   - Navigate to the backend directory:
     ```bash
     cd PMS-backend
     ```
   - Configure the database connection string in `appsettings.json` to match your SQL Server setup.
   - Restore dependencies and build the project:
     ```bash
     dotnet restore
     dotnet build
     ```
   - Apply database migrations (if using Entity Framework):
     ```bash
     dotnet ef database update
     ```
   - Run the backend server:
     ```bash
     dotnet run
     ```

3. **Frontend Setup (`PMS-frontend`):**
   - Navigate to the frontend directory:
     ```bash
     cd ../PMS-frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the frontend development server:
     ```bash
     npm start
     ```
   - The app will typically be available at `http://localhost:3000`.

4. **Accessing the Application:**
   - Ensure both backend and frontend servers are running.
   - Access the frontend via your browser. The frontend will communicate with the backend API for all data operations.

## Project Structure

```
Project-Management-System/
├── PMS-backend/    # C# .NET backend source code
├── PMS-frontend/   # React frontend source code
└── .gitignore
```

## Contributing

We welcome professional contributions that align with our project goals. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with clear and descriptive messages.
4. Submit a pull request detailing your changes and the motivation behind them.

Please review our guidelines before submitting contributions.

## License

This project is currently not licensed.

---

For questions or support, please contact the repository owner at [tanujapujari](https://github.com/tanujapujari).
