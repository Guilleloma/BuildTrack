import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Tooltip,
  LinearProgress,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import PercentIcon from '@mui/icons-material/Percent';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import ProgressDisplay from './ProgressDisplay';
import { formatCurrency } from '../utils/formatters';
import { getApiUrl } from '../config';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSandbox = location.pathname.startsWith('/sandbox');

  console.log('[ProjectDetail] Current location:', {
    pathname: location.pathname,
    isSandbox
  });

  const handleBackClick = () => {
    console.log('[ProjectDetail] Back button clicked:', {
      isSandbox,
      currentPath: location.pathname
    });
    const basePath = isSandbox ? '/sandbox' : '/app';
    console.log('[ProjectDetail] Navigating to:', basePath);
    navigate(basePath);
  };

  const [project, setProject] = React.useState(null);
  const [projectProgress, setProjectProgress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [milestoneFormOpen, setMilestoneFormOpen] = React.useState(false);
  const [taskFormOpen, setTaskFormOpen] = React.useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = React.useState(false);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [paymentsRefreshTrigger, setPaymentsRefreshTrigger] = React.useState(0);
  const [reportDialogOpen, setReportDialogOpen] = React.useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = React.useState(null);

  const fetchProjectProgress = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/projects/${id}/progress`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error fetching project progress');
      const data = await response.json();
      setProjectProgress(data);
    } catch (err) {
      console.error('Error fetching project progress:', err);
    }
  }, [id]);

  const fetchProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/projects/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Project not found');
      const data = await response.json();
      
      // Obtener el progreso del proyecto
      const progressResponse = await fetch(getApiUrl(`/projects/${id}/progress`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!progressResponse.ok) throw new Error('Error fetching project progress');
      const progressData = await progressResponse.json();
      
      setProject(data);
      setProjectProgress(progressData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const milestoneId = params.get('milestone');
    if (milestoneId) {
      setExpandedMilestoneId(milestoneId);
    }
  }, [location]);

  const handleCreateMilestone = async (milestoneData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/projects/${id}/milestones`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(milestoneData)
      });
      if (!response.ok) throw new Error('Error creating milestone');
      await fetchProject();
      setMilestoneFormOpen(false);
    } catch (err) {
      console.error('Error creating milestone:', err);
    }
  };

  const handleUpdateMilestone = async (milestoneId, milestoneData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/projects/${id}/milestones/${milestoneId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(milestoneData)
      });
      if (!response.ok) throw new Error('Error updating milestone');
      await fetchProject();
      setMilestoneFormOpen(false);
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/projects/${id}/milestones/${milestoneId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error deleting milestone');
      await fetchProject();
    } catch (err) {
      console.error('Error deleting milestone:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      const response = await fetch(getApiUrl(`/projects/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting project');
      navigate('/projects');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch(getApiUrl(`/projects/${id}/milestones/${selectedMilestone._id}/tasks`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          milestone: selectedMilestone._id,
          status: 'PENDING'
        }),
      });
      if (!response.ok) throw new Error('Error creating task');
      
      const data = await response.json();
      
      // Update the project data with the new task
      setProject(prevProject => {
        const updatedMilestones = prevProject.milestones.map(m => {
          if (m._id === selectedMilestone._id) {
            return {
              ...m,
              tasks: [...(m.tasks || []), data.task]
            };
          }
          return m;
        });
        return {
          ...prevProject,
          milestones: updatedMilestones
        };
      });
      
      await fetchProjectProgress();
      setTaskFormOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await fetch(
        getApiUrl(`/projects/${id}/milestones/${selectedMilestone._id}/tasks/${selectedTask._id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            milestone: selectedMilestone._id,
            status: selectedTask.status
          }),
        }
      );
      if (!response.ok) throw new Error('Error updating task');
      await fetchProject();
      setTaskFormOpen(false);
      setSelectedTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (milestone_id, task_id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await fetch(getApiUrl(`/projects/${id}/milestones/${milestone_id}/tasks/${task_id}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting task');
      }

      // Actualizar el proyecto y su progreso
      await Promise.all([
        fetchProject(),
        fetchProjectProgress()
      ]);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  const handleToggleTask = async (milestone_id, task) => {
    try {
      const response = await fetch(
        getApiUrl(`/projects/${id}/milestones/${milestone_id}/tasks/${task._id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...task,
            milestone: milestone_id,
            status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' 
          }),
        }
      );
      if (!response.ok) throw new Error('Error updating task');
      await fetchProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      const response = await fetch(getApiUrl('/payments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error processing payment');
      }
      
      // Actualizar el proyecto y su progreso
      await Promise.all([
        fetchProject(),
        fetchProjectProgress()
      ]);

      setPaymentsRefreshTrigger(prev => prev + 1);
      setPaymentFormOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${id}/report/pdf`), {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Error generating PDF report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${project.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(getApiUrl(`/projects/${id}/report/excel`), {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Error generating Excel report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${project.name.toLowerCase().replace(/\s+/g, '-')}-report.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReportDialogClose = () => {
    setReportDialogOpen(false);
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            variant="outlined"
            onClick={handleBackClick}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Projects
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProject}
          >
            Delete Project
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {project.name}
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                {project?.description && (
                  <Typography color="textSecondary" paragraph>
                    {project.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PaymentIcon />}
                  onClick={() => {
                    setSelectedMilestone(null);
                    setPaymentFormOpen(true);
                  }}
                >
                  Distributed Payment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => setReportDialogOpen(true)}
                >
                  Generate Report
                </Button>
              </Box>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Progreso General del Proyecto
              </Typography>
              
              {/* Barra de progreso de tareas */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tareas Completadas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {projectProgress?.overallProgress?.completedTasks}/{projectProgress?.overallProgress?.totalTasks} ({Math.round(projectProgress?.overallProgress?.taskCompletionPercentage || 0)}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={projectProgress?.overallProgress?.taskCompletionPercentage || 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                />
              </Box>

              {/* Barra de progreso de pagos base */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Base
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(projectProgress?.totals?.base_paid || 0)}/{formatCurrency(projectProgress?.totals?.base || 0)} ({Math.round((projectProgress?.totals?.base_paid / projectProgress?.totals?.base || 0) * 100)}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(projectProgress?.totals?.base_paid / projectProgress?.totals?.base || 0) * 100}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                />
              </Box>

              {/* Barra de progreso de IVA */}
              {projectProgress?.totals?.tax > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      IVA ({projectProgress?.defaultTaxRate || 21}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(projectProgress?.totals?.tax_paid || 0)}/{formatCurrency(projectProgress?.totals?.tax || 0)} ({Math.round((projectProgress?.totals?.tax_paid / projectProgress?.totals?.tax || 0) * 100)}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(projectProgress?.totals?.tax_paid / projectProgress?.totals?.tax || 0) * 100}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.200' }}
                  />
                </Box>
              )}

              {/* Total con IVA */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Total Pagado: {formatCurrency(projectProgress?.totals?.paid || 0)} / {formatCurrency(projectProgress?.totals?.totalWithTax || 0)} ({Math.round(projectProgress?.totals?.paymentPercentage || 0)}%)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Botón New Milestone antes de la lista de milestones */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedMilestone(null);
              setMilestoneFormOpen(true);
            }}
          >
            New Milestone
          </Button>
        </Box>

        {projectProgress?.milestones?.map((milestone, index) => {
          const milestoneData = project.milestones.find(m => m._id === milestone._id);
          if (!milestoneData) return null;
          
          const showWarning = milestone.paymentPercentage > milestone.taskCompletionPercentage;
          const showPaymentNeeded = milestone.taskCompletionPercentage > milestone.paymentPercentage;
          
          // Calculate tax amounts
          const baseAmount = milestoneData.budget;
          const taxAmount = milestoneData.hasTax 
            ? baseAmount * (milestoneData.taxRate || 21) / 100 
            : 0;
          const totalWithTax = baseAmount + taxAmount;
          
          return (
            <Accordion 
              key={milestone._id}
              expanded={expandedMilestoneId === milestone._id}
              onChange={(e, isExpanded) => {
                setExpandedMilestoneId(isExpanded ? milestone._id : null);
                // Update URL without reloading
                const newUrl = isExpanded 
                  ? `${location.pathname}?milestone=${milestone._id}`
                  : location.pathname;
                navigate(newUrl, { replace: true });
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  my: 0.5,
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    backgroundColor: '#f0f2f5',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  },
                  minHeight: '48px !important',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0 !important',
                  }
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '200px' }}>
                    {milestone.taskCompletionPercentage >= 100 && (
                      <TaskAltIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    )}
                    {showWarning && (
                      <Tooltip title="El porcentaje de pago supera al porcentaje de tareas completadas">
                        <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                    {showPaymentNeeded && (
                      <Tooltip title="Hay más tareas completadas que pagos realizados">
                        <MonetizationOnIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      </Tooltip>
                    )}
                    {milestoneData.hasTax && (
                      <Tooltip title={`IVA ${milestoneData.taxRate || 21}%`}>
                        <PercentIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                      </Tooltip>
                    )}
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {milestoneData.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: milestone.taskCompletionPercentage >= 100 ? 'success.main' : 'text.secondary' }}>
                    <TaskAltIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">
                      {milestone.completedTasks}/{milestone.totalTasks} ({Math.round(milestone.taskCompletionPercentage)}%)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: milestone.paymentPercentage >= 100 ? 'success.main' : 'text.secondary' }}>
                    <PaymentIcon sx={{ fontSize: 16 }} />
                    <Tooltip title={
                      milestoneData.hasTax 
                        ? `Base: ${formatCurrency(baseAmount)}\nIVA (${milestoneData.taxRate || 21}%): ${formatCurrency(taxAmount)}\nTotal: ${formatCurrency(totalWithTax)}`
                        : "Sin IVA"
                    }>
                      <Typography variant="body2">
                        {formatCurrency(milestoneData.paidAmount * (milestoneData.hasTax ? (1 + (milestoneData.taxRate || 21) / 100) : 1))}/{formatCurrency(totalWithTax)} ({Math.round(milestone.paymentPercentage)}%)
                      </Typography>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMilestone(milestoneData);
                        setMilestoneFormOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMilestone(milestone._id);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMilestone(milestoneData);
                        setPaymentFormOpen(true);
                      }}
                      disabled={milestone.paymentPercentage >= 100}
                      sx={{
                        color: milestone.paymentPercentage >= 100 ? 'success.main' : 'inherit'
                      }}
                    >
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                {milestoneData.description && (
                  <Typography color="text.secondary" variant="body2" paragraph sx={{ mb: 2 }}>
                    {milestoneData.description}
                  </Typography>
                )}

                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Base Amount: {formatCurrency(baseAmount)}
                  </Typography>
                  {milestoneData.hasTax && (
                    <Typography variant="subtitle2" color="text.secondary">
                      Tax Amount ({milestoneData.taxRate || 21}%): {formatCurrency(taxAmount)}
                    </Typography>
                  )}
                  <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                    Total Amount: {formatCurrency(totalWithTax)}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Paid Amount: {formatCurrency(milestoneData.paidAmount || 0)}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pending Amount: {formatCurrency(totalWithTax - (milestoneData.paidAmount || 0))}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedMilestone(milestoneData);
                      setSelectedTask(null);
                      setTaskFormOpen(true);
                    }}
                  >
                    Add Task
                  </Button>
                </Box>
                <List dense>
                  {(milestoneData.tasks || [])?.map((task) => (
                    <ListItem
                      key={task._id}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => {
                              setSelectedMilestone(milestoneData);
                              setSelectedTask(task);
                              setTaskFormOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTask(milestone._id, task._id)}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'error.light',
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      disableGutters
                    >
                      <Checkbox
                        checked={task?.status === 'COMPLETED'}
                        onChange={() => handleToggleTask(milestone._id, task)}
                        size="small"
                      />
                      <ListItemText
                        primary={task.name}
                        secondary={task.description}
                        primaryTypographyProps={{
                          variant: 'body2',
                          style: {
                            textDecoration: task?.status === 'COMPLETED' ? 'line-through' : 'none',
                            color: task?.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
                          }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                {milestoneData.tasks?.length > 0 && <Divider sx={{ my: 2 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PaymentIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6">
                    Pagos Realizados
                  </Typography>
                </Box>
                <PaymentHistory
                  projectId={id}
                  milestoneId={milestone._id}
                  refreshTrigger={paymentsRefreshTrigger}
                  onPaymentDeleted={async () => {
                    await Promise.all([
                      fetchProject(),
                      fetchProjectProgress()
                    ]);
                  }}
                />
              </AccordionDetails>
            </Accordion>
          );
        })}

        <MilestoneForm
          open={milestoneFormOpen}
          onClose={() => {
            setMilestoneFormOpen(false);
            setSelectedMilestone(null);
          }}
          onSubmit={selectedMilestone ? handleUpdateMilestone : handleCreateMilestone}
          milestone={selectedMilestone}
        />

        <TaskForm
          open={taskFormOpen}
          onClose={() => {
            setTaskFormOpen(false);
            setSelectedTask(null);
          }}
          onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
          task={selectedTask}
        />

        {paymentFormOpen && (
          <PaymentForm
            open={paymentFormOpen}
            onClose={() => setPaymentFormOpen(false)}
            onSubmit={handlePaymentComplete}
            milestone={selectedMilestone}
            project={project}
          />
        )}

        <Dialog
          open={reportDialogOpen}
          onClose={handleReportDialogClose}
          aria-labelledby="report-dialog-title"
        >
          <DialogTitle id="report-dialog-title">
            Select Report Format
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => {
                  handleExportPDF();
                  handleReportDialogClose();
                }}
                sx={{ 
                  minWidth: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  py: 2
                }}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<TableViewIcon />}
                onClick={() => {
                  handleExportExcel();
                  handleReportDialogClose();
                }}
                sx={{ 
                  minWidth: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  py: 2
                }}
              >
                Excel
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReportDialogClose}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default ProjectDetail; 