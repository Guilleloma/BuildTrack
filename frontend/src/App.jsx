import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Componente para loggear cambios de ruta
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('App - Route changed:', {
      pathname: location.pathname,
      hash: location.hash,
      search: location.search,
      state: location.state
    });
  }, [location]);

  return null;
};

function App() {
  console.log('App - Rendering');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <RouteLogger />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Ruta de sandbox (sin autenticación) */}
            <Route path="/sandbox" element={
              <Layout>
                <ProjectList />
              </Layout>
            } />
            
            {/* Rutas protegidas */}
            <Route path="/app/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route index element={<ProjectList />} />
                    <Route path="projects">
                      <Route path="new" element={<ProjectForm />} />
                      <Route path=":id" element={<ProjectDetail />} />
                    </Route>
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 