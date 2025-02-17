import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import PaymentsPage from './components/PaymentsPage';
import SettingsPage from './components/SettingsPage';
import { Typography, Container } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';
import Home from './components/Home';
import Sandbox from './components/Sandbox';
import Login from './components/Login';

// Placeholder components for other routes
const Dashboard = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Typography>Welcome to BuildTrack Dashboard</Typography>
  </Container>
);

function App() {
  console.log('App component rendering');
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                {console.log('Rendering Home route')}
                <Home />
              </>
            } 
          />
          <Route 
            path="/login" 
            element={
              <>
                {console.log('Rendering Login route')}
                <Login />
              </>
            } 
          />
          <Route
            path="/app/*"
            element={
              <>
                {console.log('Rendering Layout route')}
                <Layout>
                  <Routes>
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/new" element={<ProjectForm />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/sandbox" element={<Sandbox />} />
                  </Routes>
                </Layout>
              </>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 