# BuildTrack - Remodeling Management Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of Contents
1. [The Problem](#the-problem)  
2. [The Solution: BuildTrack](#the-solution-buildtrack)  
3. [Technologies Used](#technologies-used)  
4. [Key Features](#key-features)  
5. [Budget Deviations Tracking](#budget-deviations-tracking)  
6. [Getting Started](#getting-started)  
7. [Contributing](#contributing)  
8. [License](#license)

---

## The Problem
Remodeling and construction projects can be complex processes, involving multiple items, staggered payments, and risks of budget overruns. The lack of a structured management tool often leads to:

- **Lack of transparency**: Clients do not have a clear view of progress and real costs.  
- **Uncontrolled budget deviations**: Unexpected changes inflate costs without proper tracking.  
- **Disorganized payments**: There's no clear method to release payments based on actual progress.  
- **Insufficient documentation**: No standardized system to validate materials, progress, and cost justifications.  
- **Deteriorated trust**: The lack of oversight undermines trust between clients and professionals.

---

## The Solution: BuildTrack
BuildTrack is a platform designed to manage remodeling projects in a structured and transparent way, ensuring detailed control of progress, payments, and budget deviations. It streamlines communication between clients and professionals, enabling precise real-time project tracking.

**Key Benefits:**
- A single platform for financial control and deviation tracking.  
- Task and milestone management to avoid confusion during execution.  
- Easy communication among all parties involved.

---

## Technologies Used
- **Frontend:** React with Material UI
- **Backend:** Node.js with Express
- **Database:** PostgreSQL
- **Authentication:** JWT-based authentication
- **Payment Processing:** ✓ Implemented

These technologies are suggested and may vary based on project needs.

---

## Key Features
1. **Registration & Authentication**: ✓ Implemented - JWT-based authentication with registration and login functionality.
2. **Project Creation**: ✓ Implemented - Full CRUD functionality for projects with REST API endpoints.
3. **Task/Milestone Management**: ✓ Implemented - Hierarchical structure with projects > milestones > tasks, including status tracking.
4. **Payment System**: ✓ Implemented - Payment processing with milestone-based tracking and amount validation.
5. **Validation & Documentation**: 🚧 In Progress
6. **Dashboard**: ✓ Basic implementation with auto-updating UI and debug logging.
7. **Feedback & Reviews**: 🚧 Planned

---

## Budget Deviations Tracking
- Each item/part of the project has an **assigned initial budget**.  
- **Deviations** are logged when there are differences between the estimated budget and actual spending.  
- The **reason for the deviation** is recorded (unexpected issues, material changes, extra labor costs).  
- The **percentage of deviation** is calculated for each item.  
- A dashboard provides real-time data on:
  - **Initial budget vs. current expenses**  
  - **Absolute difference (€) and percentage of deviation (%)**  
- Upon completion, a **cost report** is generated, including:
  - Total initial budget  
  - Total actual spending  
  - Total deviation in both euros and percentage  
  - Option to export a PDF or Excel report

---

## Getting Started
1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-username/BuildTrack.git
   ```
2. **Install dependencies**  
   For backend:
   ```bash
   cd BuildTrack/backend
   npm install
   ```
   For frontend:
   ```bash
   cd BuildTrack/frontend
   npm install
   ```
3. **Set up environment variables**  
   Create a `.env` file in the backend directory with:
   - Database connection details
   - JWT secret key
   - Server port (default: 3000)
   
   Create a `.env` file in the frontend directory with:
   - Backend API URL
   - Frontend port (default: 3001)

4. **Run the application**  
   Start the backend:
   ```bash
   cd backend
   npm start
   ```
   Start the frontend in a new terminal:
   ```bash
   cd frontend
   npm start
   ```
   
   The backend will run on http://localhost:3000 and the frontend on http://localhost:3001

---

## Contributing
We welcome all contributions!  
1. **Fork** this repository.  
2. Create a new branch (`git checkout -b new-feature`).  
3. Make your changes and add detailed **commits**.  
4. Open a **Pull Request**, describing your changes clearly.

---

## License
This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for more details.
