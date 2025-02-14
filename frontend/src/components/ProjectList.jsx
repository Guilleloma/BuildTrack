import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, TextField, Grid, CircularProgress, Container, Paper, Box, LinearProgress } from '@mui/material';
import { formatCurrency } from '../utils/formatters';

const ProjectList = () => {
  console.log('ProjectList component rendering');
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      console.log('Fetching projects...');
      try {
        const response = await fetch('/projects');
        console.log('Response:', response);
        if (!response.ok) throw new Error('Error fetching projects');
        const data = await response.json();
        console.log('Projects data:', data);
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error.message);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const handleSearch = (e) => {
    setFilter(e.target.value);
  };

  const handleProjectClick = (projectId) => {
    console.log('Project clicked:', projectId);
    navigate(`/projects/${projectId}`);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <CircularProgress />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper style={{ padding: '20px', marginTop: '20px' }}>
          <Typography variant="subtitle1" color="error" align="center">
            {error}
          </Typography>
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: '30px' }}>
          Project List
        </Typography>
        
        <TextField
          label="Buscar proyectos"
          variant="outlined"
          fullWidth
          margin="normal"
          value={filter}
          onChange={handleSearch}
        />

        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Typography variant="subtitle1" gutterBottom>
              No se encontraron proyectos.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/projects/new')}
              style={{ marginTop: '20px' }}
            >
              Crear Proyecto
            </Button>
          </div>
        ) : (
          <Grid container spacing={3} style={{ marginTop: '20px' }}>
            {filteredProjects.map(project => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  onClick={() => handleProjectClick(project.id)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {project.name}
                    </Typography>
                    {project.description && (
                      <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }}>
                        {project.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Presupuesto total: {formatCurrency(project.progress?.totalCost || 0)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 140 }}>
                          Pagado: {Math.round(project.progress?.paymentPercentage || 0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={project.progress?.paymentPercentage || 0}
                          sx={{ 
                            flexGrow: 1,
                            ml: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4caf50',
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ minWidth: 140 }}>
                          Completado: {Math.round(project.progress?.taskCompletionPercentage || 0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={project.progress?.taskCompletionPercentage || 0}
                          sx={{ 
                            flexGrow: 1,
                            ml: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#2196f3',
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ProjectList;
