import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Register from './components/Register';

// Placeholder components for other routes
const Dashboard = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Typography>Welcome to BuildTrack Dashboard</Typography>
  </Container>
);

function App() {
  useEffect(() => {
    console.log('App component mounted');
    console.log('Current path:', window.location.hash);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        {console.log('Router rendering, current hash:', window.location.hash)}
        <Routes>
          <Route 
            path="/"
            element={<Home />}
          />
          <Route 
            path="/login" 
            element={<Login />}
          />
          <Route 
            path="/register" 
            element={<Register />}
          />
          <Route
            path="/sandbox/*"
            element={
              <Layout>
                <ProjectList />
              </Layout>
            }
          />
          <Route
            path="/app/*"
            element={<Layout />}
          >
            <Route index element={<ProjectList />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 