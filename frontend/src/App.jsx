import React from 'react';
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
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Placeholder components for other routes
const Dashboard = () => (
  <Container>
    <Typography variant="h4" gutterBottom>Dashboard</Typography>
    <Typography>Welcome to BuildTrack Dashboard</Typography>
  </Container>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route index element={<ProjectList />} />
                      <Route path="projects/new" element={<ProjectForm />} />
                      <Route path="projects/:id" element={<ProjectDetail />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 