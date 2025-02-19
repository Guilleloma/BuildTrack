import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingMessage from './LoadingMessage';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Grid, 
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

  const fetchProjects = useCallback(async () => {
    try {
      console.log('[ProjectList] Iniciando fetchProjects:', { 
        isSandbox, 
        userId: user?.uid,
        currentPath: location.pathname 
      });

      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[ProjectList] Token añadido a la petición para usuario:', user.email);
      }

      const url = getApiUrl('projects', isSandbox, !isSandbox && user ? user.uid : null);
      console.log('[ProjectList] Fetching projects from URL:', url);

      const response = await fetch(url, {
        headers,
        credentials: 'include'
      });

      console.log('[ProjectList] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[ProjectList] Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Error fetching projects: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ProjectList] Projects received:', {
        count: data.length,
        projects: data.map(p => ({ id: p._id, name: p.name, userId: p.userId }))
      });

      setProjects(data);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('[ProjectList] Error in fetchProjects:', error);
      setError(`Error al cargar los proyectos: ${error.message}`);
      setLoading(false);
    }
  }, [isSandbox, user, location.pathname]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = (e) => {
    setFilter(e.target.value);
  };

  const handleProjectClick = (projectId) => {
    console.log('[ProjectList] Project clicked:', {
      projectId,
      currentPath: location.pathname,
      isSandbox
    });

    const basePath = isSandbox ? '/sandbox' : '/app';
    const projectPath = `${basePath}/projects/${projectId}`;
    
    console.log('[ProjectList] Navigating to:', projectPath);
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

      const url = getApiUrl(`projects/${projectId}`, isSandbox);
      console.log('[ProjectList] Deleting project:', {
        url,
        projectId,
        isSandbox
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[ProjectList] Error deleting project:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Error deleting project: ${response.status} ${response.statusText}`);
      }

      setProjects(projects.filter(p => p._id !== projectId));
      setError(null);
    } catch (error) {
      console.error('[ProjectList] Error in handleDeleteProject:', error);
      setError('Error al eliminar el proyecto: ' + error.message);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <LoadingMessage message="Loading projects..." />;
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
          {isSandbox ? 'Projects (Sandbox)' : 'My Projects'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log('[ProjectList] Create Project clicked:', {
                isSandbox,
                currentPath: location.pathname
              });
              const basePath = isSandbox ? '/sandbox' : '/app';
              const newProjectPath = `${basePath}/projects/new`;
              console.log('[ProjectList] Navigating to:', newProjectPath);
              navigate(newProjectPath);
            }}
          >
            Create Project
          </Button>
        </Box>

        {isSandbox && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are in Sandbox mode. Projects created here are public and can be modified by any user.
          </Alert>
        )}
        
        <TextField
          label="Search projects"
          variant="outlined"
          fullWidth
          margin="normal"
          value={filter}
          onChange={handleSearch}
        />

        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Typography variant="subtitle1" gutterBottom>
              No projects found.
            </Typography>
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
                          <span>Budget:</span>
                          <span>{formatCurrency(project.progress?.paidAmount || 0)} / {formatCurrency(project.progress?.totalCost || 0)}</span>
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ minWidth: 140 }}>
                            Paid: {Math.round(project.progress?.paymentPercentage || 0)}%
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
