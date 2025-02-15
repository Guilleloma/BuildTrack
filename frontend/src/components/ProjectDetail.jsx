import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import ProgressDisplay from './ProgressDisplay';
import { formatCurrency } from '../utils/formatters';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const fetchProjectProgress = useCallback(async () => {
    try {
      const response = await fetch(`/projects/${id}/progress`);
      if (!response.ok) throw new Error('Error fetching project progress');
      const data = await response.json();
      setProjectProgress(data);
    } catch (err) {
      console.error('Error fetching project progress:', err);
    }
  }, [id]);

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/projects/${id}`);
      if (!response.ok) throw new Error('Project not found');
      const data = await response.json();
      setProject(data);
      await fetchProjectProgress();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, fetchProjectProgress]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleCreateMilestone = async (milestoneData) => {
    try {
      const response = await fetch(`/projects/${id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneData),
      });
      if (!response.ok) throw new Error('Error creating milestone');
      await fetchProject();
      setMilestoneFormOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMilestone = async (milestoneData) => {
    try {
      const response = await fetch(`/projects/${id}/milestones/${selectedMilestone._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneData),
      });
      if (!response.ok) throw new Error('Error updating milestone');
      await fetchProject();
      setMilestoneFormOpen(false);
      setSelectedMilestone(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMilestone = async (milestone_id) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      const response = await fetch(`/projects/${id}/milestones/${milestone_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting milestone');
      await fetchProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/projects/${id}`, {
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
      const response = await fetch(`/projects/${id}/milestones/${selectedMilestone._id}/tasks`, {
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
        `/projects/${id}/milestones/${selectedMilestone._id}/tasks/${selectedTask._id}`,
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
      const response = await fetch(`/projects/${id}/milestones/${milestone_id}/tasks/${task_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting task');
      await fetchProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleTask = async (milestone_id, task) => {
    try {
      const response = await fetch(
        `/projects/${id}/milestones/${milestone_id}/tasks/${task._id}`,
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
      const response = await fetch('/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestone._id,
          amount: parseFloat(paymentData.amount),
          description: paymentData.description,
          paymentMethod: paymentData.paymentMethod
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error processing payment');
      }
      
      await fetchProject();
      setPaymentsRefreshTrigger(prev => prev + 1);
      setPaymentFormOpen(false);
    } catch (err) {
      throw err; // Let the PaymentForm handle the error
    }
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
    <Container>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/projects')}
          sx={{ mr: 2 }}
        >
          Back to Projects
        </Button>
        <Box>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProject}
            sx={{ mr: 2 }}
          >
            Delete Project
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedMilestone(null);
              setMilestoneFormOpen(true);
            }}
          >
            Add Milestone
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {project?.name}
          </Typography>
          {project?.description && (
            <Typography color="textSecondary" paragraph>
              {project.description}
            </Typography>
          )}
          {projectProgress?.overallProgress && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Progreso General del Proyecto
              </Typography>
              <ProgressDisplay 
                progress={projectProgress.overallProgress} 
                type="project"
              />
            </>
          )}
        </CardContent>
      </Card>

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
          <Accordion key={milestone._id} sx={{ mb: 0.5 }}>
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
                      {formatCurrency(milestoneData.paidAmount || 0)}/{formatCurrency(totalWithTax)} ({Math.round(milestone.paymentPercentage)}%)
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

      <PaymentForm
        open={paymentFormOpen}
        onClose={() => {
          setPaymentFormOpen(false);
          setSelectedMilestone(null);
        }}
        onSubmit={handlePaymentComplete}
        milestone={selectedMilestone}
        projectId={id}
      />
    </Container>
  );
};

export default ProjectDetail; 