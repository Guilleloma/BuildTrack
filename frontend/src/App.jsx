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
            index
            element={
              <>
                {console.log('Rendering Home route')}
                <Home />
              </>
            } 
          />
          <Route 
            path="login" 
            element={
              <>
                {console.log('Rendering Login route')}
                <Login />
              </>
            } 
          />
          <Route
            path="projects"
            element={
              <>
                {console.log('Rendering Layout with ProjectList')}
                <Layout>
                  <ProjectList />
                </Layout>
              </>
            }
          />
          <Route
            path="projects/new"
            element={
              <Layout>
                <ProjectForm />
              </Layout>
            }
          />
          <Route
            path="projects/:id"
            element={
              <Layout>
                <ProjectDetail />
              </Layout>
            }
          />
          <Route
            path="payments"
            element={
              <Layout>
                <PaymentsPage />
              </Layout>
            }
          />
          <Route
            path="settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />
          <Route
            path="sandbox"
            element={
              <Layout>
                <Sandbox />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 