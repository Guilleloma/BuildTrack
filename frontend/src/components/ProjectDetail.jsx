import React from 'react';
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
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MilestoneForm from './MilestoneForm';
import TaskForm from './TaskForm';
import { formatCurrency } from '../utils/formatters';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [milestoneFormOpen, setMilestoneFormOpen] = React.useState(false);
  const [taskFormOpen, setTaskFormOpen] = React.useState(false);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [selectedTask, setSelectedTask] = React.useState(null);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/projects/${id}`);
      if (!response.ok) throw new Error('Project not found');
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProject();
  }, [id]);

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
      const response = await fetch(`/projects/${id}/milestones/${selectedMilestone.id}`, {
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

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      const response = await fetch(`/projects/${id}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting milestone');
      await fetchProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch(`/projects/${id}/milestones/${selectedMilestone.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Error creating task');
      await fetchProject();
      setTaskFormOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await fetch(
        `/projects/${id}/milestones/${selectedMilestone.id}/tasks/${selectedTask.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
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

  const handleDeleteTask = async (milestoneId, taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await fetch(`/projects/${id}/milestones/${milestoneId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting task');
      await fetchProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleTask = async (milestoneId, task) => {
    try {
      const response = await fetch(
        `/projects/${id}/milestones/${milestoneId}/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, completed: !task.completed }),
        }
      );
      if (!response.ok) throw new Error('Error updating task');
      await fetchProject();
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
        </CardContent>
      </Card>

      {project?.milestones?.map((milestone) => (
        <Accordion key={milestone.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{milestone.title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip
                    label={formatCurrency(milestone.totalCost)}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Paid: ${formatCurrency(milestone.paidAmount)}`}
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Pending: ${formatCurrency(milestone.pendingAmount)}`}
                    color="warning"
                    size="small"
                  />
                </Box>
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMilestone(milestone);
                    setMilestoneFormOpen(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMilestone(milestone.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {milestone.description && (
              <Typography color="textSecondary" paragraph>
                {milestone.description}
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => {
                  setSelectedMilestone(milestone);
                  setSelectedTask(null);
                  setTaskFormOpen(true);
                }}
              >
                Add Task
              </Button>
            </Box>
            <List>
              {milestone.tasks?.map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setSelectedTask(task);
                          setTaskFormOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteTask(milestone.id, task.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggleTask(milestone.id, task)}
                  />
                  <ListItemText
                    primary={task.title}
                    secondary={task.description}
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'text.disabled' : 'text.primary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <MilestoneForm
        open={milestoneFormOpen}
        onClose={() => {
          setMilestoneFormOpen(false);
          setSelectedMilestone(null);
        }}
        onSubmit={selectedMilestone ? handleUpdateMilestone : handleCreateMilestone}
        initialData={selectedMilestone}
      />

      <TaskForm
        open={taskFormOpen}
        onClose={() => {
          setTaskFormOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        initialData={selectedTask}
      />
    </Container>
  );
};

export default ProjectDetail; 