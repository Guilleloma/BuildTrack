import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';

const ProjectForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSandbox = location.pathname.startsWith('/sandbox');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      // Si estamos en modo autenticado, añadimos el token
      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://buildtrack.onrender.com/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          userId: isSandbox ? 'sandbox' : user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el proyecto');
      }

      // Redirigir a la lista de proyectos
      const basePath = isSandbox ? '/sandbox' : '/app';
      navigate(basePath);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {isSandbox ? 'New Project (Sandbox)' : 'New Project'}
        </Typography>

        {isSandbox && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are creating a project in Sandbox mode. It will be visible and modifiable by all users.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            required
            fullWidth
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            disabled={loading}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate(isSandbox ? '/sandbox' : '/app')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProjectForm; 