import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import { Typography, Container } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';

// Placeholder components for other routes
const Dashboard = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Typography>Welcome to BuildTrack Dashboard</Typography>
  </Container>
);

const Payments = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Payments</Typography>
    <Typography>Payment management coming soon</Typography>
  </Container>
);

const Settings = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Settings</Typography>
    <Typography>System settings coming soon</Typography>
  </Container>
);

function App() {
  console.log('App component rendering');
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 