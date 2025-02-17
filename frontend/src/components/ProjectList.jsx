import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Grid, 
  CircularProgress, 
  Container, 
  Paper, 
  Box, 
  LinearProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { formatCurrency } from '../utils/formatters';
import { getApiUrl } from '../config';

const ProjectList = () => {
  console.log('ProjectList component rendering');
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSandbox = location.pathname.startsWith('/sandbox');

  useEffect(() => {
    fetchProjects();
  }, [user, isSandbox]);

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...', { isSandbox, userId: user?.uid });
      let headers = {
        'Content-Type': 'application/json'
      };

      // Si estamos en modo autenticado, añadimos el token
      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://buildtrack.onrender.com/projects', {
        headers
      });

      console.log('Response:', response);
      if (!response.ok) throw new Error('Error fetching projects');
      
      const data = await response.json();
      console.log('Projects data:', data);
      setProjects(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Error al cargar los proyectos');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilter(e.target.value);
  };

  const handleProjectClick = (projectId) => {
    console.log('Project clicked:', projectId);
    const basePath = location.pathname.startsWith('/app') ? '/app' : '';
    const projectPath = `${basePath}/projects/${projectId}`;
    console.log('Navigating to:', projectPath);
    navigate(projectPath);
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`https://buildtrack.onrender.com/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) throw new Error('Error deleting project');
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Error al eliminar el proyecto');
    }
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
          {isSandbox ? 'Proyectos (Sandbox)' : 'Mis Proyectos'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const basePath = location.pathname.startsWith('/app') ? '/app' : '';
              navigate(`${basePath}/projects/new`);
            }}
          >
            Nuevo Proyecto
          </Button>
        </Box>

        {isSandbox && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Estás en modo Sandbox. Los proyectos creados aquí son públicos y pueden ser modificados por cualquier usuario.
          </Alert>
        )}
        
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
              onClick={() => {
                const basePath = location.pathname.startsWith('/app') ? '/app' : '';
                navigate(`${basePath}/projects/new`);
              }}
              style={{ marginTop: '20px' }}
            >
              Crear Proyecto
            </Button>
          </div>
        ) : (
          <Grid container spacing={3} style={{ marginTop: '20px' }}>
            {filteredProjects.map(project => {
              const showWarning = project.progress?.paymentPercentage > project.progress?.taskCompletionPercentage;
              const showPaymentNeeded = project.progress?.taskCompletionPercentage > project.progress?.paymentPercentage;

              return (
                <Grid item xs={12} sm={6} md={4} key={project._id}>
                  <Card 
                    onClick={() => handleProjectClick(project._id)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}
                  >
                    {showWarning && (
                      <Tooltip title="El porcentaje de pago supera al porcentaje de tareas completadas">
                        <WarningIcon 
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 1,
                            color: 'warning.main',
                            fontSize: 20
                          }} 
                        />
                      </Tooltip>
                    )}
                    {showPaymentNeeded && (
                      <Tooltip title="Hay más tareas completadas que pagos realizados">
                        <MonetizationOnIcon 
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            left: showWarning ? 32 : 8,
                            zIndex: 1,
                            color: 'success.main',
                            fontSize: 20
                          }} 
                        />
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDeleteProject(e, project._id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: 'error.light',
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }}>
                          {project.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Presupuesto:</span>
                          <span>{formatCurrency(project.progress?.paidAmount || 0)} / {formatCurrency(project.progress?.totalCost || 0)}</span>
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
              );
            })}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ProjectList;
