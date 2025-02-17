# BuildTrack - Remodeling Management Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of Contents
1. [The Problem](#the-problem)  
2. [The Solution: BuildTrack](#the-solution-buildtrack)  
3. [Technologies Used](#technologies-used)  
4. [Key Features](#key-features)  
5. [Budget Deviations Tracking](#budget-deviations-tracking)  
6. [Getting Started](#getting-started)  
7. [Development Workflow](#development-workflow)  
8. [Contributing](#contributing)  
9. [License](#license)

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
- **Database:** MongoDB with Mongoose
- **Authentication:** Firebase Authentication
- **State Management:** React Hooks and Context
- **UI Components:** Material-UI v5
- **API Integration:** RESTful endpoints
- **Real-time Updates:** Auto-refresh mechanisms
- **Hosting:** Firebase (Frontend) & Render.com (Backend)

These technologies have been implemented and tested in production.

---

## Key Features
1. **Authentication & User Management**: ✓ Implemented
   - Firebase Authentication integration
   - Email and password registration/login
   - Protected routes and user sessions
   - Sandbox mode for testing without authentication
   - Clear separation between user and sandbox data

2. **Project Management**: ✓ Implemented
   - Full CRUD operations for projects
   - Real-time progress tracking
   - Automatic calculations of completion percentages
   - Project deletion with cascade effect
   - User-specific project isolation

3. **Milestone & Task System**: ✓ Implemented
   - Hierarchical structure (projects > milestones > tasks)
   - Progress tracking for both tasks and payments
   - Visual progress bars with distinct colors
   - Automatic status updates
   - Tax handling with configurable rates

4. **Payment Processing**: ✓ Implemented
   - Milestone-based payment tracking
   - Payment history with detailed records
   - Multiple payment methods support (Cash, Bank Transfer, Bizum, PayPal)
   - Amount validation and status updates
   - Real-time financial progress tracking
   - Tax calculations and tracking

5. **Progress Visualization**: ✓ Implemented
   - Dual progress tracking (tasks vs payments)
   - Color-coded progress bars
   - Warning indicators for payment/task mismatches
   - Real-time updates
   - Responsive design for all screen sizes

6. **Data Management**: ✓ Implemented
   - MongoDB database integration
   - Mongoose models with relationships
   - Efficient data querying and updates
   - Cascade deletions for related entities
   - User data isolation

7. **User Interface**: ✓ Implemented
   - Material-UI components
   - Responsive design
   - Intuitive navigation
   - Form validations and keyboard navigation
   - Real-time updates without page refresh
   - Context-aware action buttons
   - Sandbox mode visual indicators

8. **Reports & Exports**: ✓ Implemented
   - PDF report generation
   - Excel report generation
   - Detailed project statistics
   - Payment tracking and history
   - Project overview with progress indicators

9. **Sandbox Environment**: ✓ Implemented
   - Public testing environment
   - No authentication required
   - Full feature access
   - Isolated data from authenticated users
   - Clear visual indicators for sandbox mode

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
   - MongoDB connection URI
   - JWT secret key
   - Server port (default: 3000)
   
   Create a `.env` file in the frontend directory with:
   - Firebase configuration
   - Backend API URL
   - Frontend port (default: 3001)

4. **Run the application**  
   You have three options to run the application:

   **Option 1: Using the macOS App (Recommended)**
   - Run the `create-app.command` script once to create the BuildTrack app
   - Move the generated `BuildTrack.app` to your Applications folder
   - Launch BuildTrack from your Applications like any other macOS app
   - The app includes a custom icon and proper macOS integration

   **Option 2: Using the startup script**
   - Double click the `start-buildtrack.command` file
   - The script will:
     - Start both backend and frontend servers in the background
     - Open the application in your default browser
     - Store logs in the `logs` directory for easy debugging
     - Clean up any existing processes on ports 3000 and 3001
     - No terminal windows needed

   **Option 3: Manual startup**  
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

5. **Accessing the Application**
   - Backend API: http://localhost:3000
   - Frontend Interface: http://localhost:3001
   - Logs (when using Options 1 or 2): Available in the `logs` directory
     - `backend.log`: Backend server logs
     - `frontend.log`: Frontend development server logs

6. **Stopping the Application**
   - For Option 1 & 2: The startup script includes automatic cleanup
   - For Option 3: Use Ctrl+C in each terminal window
   - Alternative: Use Activity Monitor to find and quit the node processes

7. **Development Mode**
   All launch methods start the application in development mode, which includes:
   - Hot reloading for frontend changes
   - Automatic server restart for backend changes
   - Real-time error reporting
   - Development tools and debugging capabilities

---

## Development Workflow
The project follows a structured branching strategy to ensure code quality and stability:

### Branches
- **trunk**: Production branch, contains the stable version of the application
- **uat**: User Acceptance Testing branch, for testing before production
- **development**: Active development branch, where new features are integrated

### Workflow
1. All new development happens in the `development` branch
2. When features are ready for testing:
   - Create a Pull Request from `development` to `uat`
   - Test thoroughly in the UAT environment
3. When testing is successful:
   - Create a Pull Request from `uat` to `trunk`
   - Deploy to production after approval

### Deployment Environments
- **Development**: For active development and initial testing
- **UAT**: https://buildtrack-uat.web.app
- **Production**: https://buildtrack-c3e8a.web.app
- **Backend API**: https://buildtrack.onrender.com

### Best Practices
- Never commit directly to `trunk`
- Always create Pull Requests for code reviews
- Ensure all tests pass before merging to `uat`
- Document all changes in commit messages and Pull Requests

---

## Contributing
We welcome all contributions! Please follow these steps:  
1. **Fork** this repository
2. **Clone** your fork locally
3. Create a new branch from `development` (`git checkout -b feature/your-feature-name development`)
4. Make your changes and add detailed **commits**
5. Push to your fork (`git push origin feature/your-feature-name`)
6. Open a **Pull Request** to our `development` branch, describing your changes clearly
7. Wait for review and address any feedback

### Pull Request Guidelines
- Create PRs against the `development` branch
- Include a clear description of the changes
- Add tests if applicable
- Ensure all tests pass
- Follow the existing code style
- Keep changes focused and atomic

---

## License
This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for more details.
