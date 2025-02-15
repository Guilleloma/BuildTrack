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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import ProgressDisplay from './ProgressDisplay';

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
          ...paymentData,
          milestone: selectedMilestone._id,
          paymentDate: new Date(),
          paymentMethod: 'BANK_TRANSFER'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error processing payment');
      }
      
      await fetchProject();
      setPaymentsRefreshTrigger(prev => prev + 1);
      setPaymentFormOpen(false);
    } catch (err) {
      setError(err.message);
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
        
        return (
          <Accordion key={milestone._id} sx={{ mb: 2 }}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#fff',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{milestoneData.name}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMilestone(milestoneData);
                        setMilestoneFormOpen(true);
                      }}
                    >
                      <EditIcon />
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
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMilestone(milestoneData);
                        setPaymentFormOpen(true);
                      }}
                      disabled={milestone.paymentPercentage >= 100}
                    >
                      <PaymentIcon />
                    </IconButton>
                  </Box>
                </Box>
                <ProgressDisplay 
                  progress={{
                    ...milestone,
                    totalCost: milestoneData.budget,
                    paidAmount: milestoneData.paidAmount || 0,
                    paymentPercentage: milestoneData.paidAmount ? (milestoneData.paidAmount / milestoneData.budget) * 100 : 0
                  }}
                  variant="compact" 
                  type="milestone"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="textSecondary" paragraph>
                {milestoneData.description}
              </Typography>
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
              <List>
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
                          <EditIcon />
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
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Checkbox
                      checked={task?.status === 'COMPLETED'}
                      onChange={() => handleToggleTask(milestone._id, task)}
                    />
                    <ListItemText
                      primary={task.name}
                      secondary={task.description}
                      sx={{
                        textDecoration: task?.status === 'COMPLETED' ? 'line-through' : 'none',
                        color: task?.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {milestoneData.tasks?.length > 0 && <Divider sx={{ my: 2 }} />}
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