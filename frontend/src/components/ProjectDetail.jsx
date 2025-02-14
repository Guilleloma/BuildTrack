import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
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

    fetchProject();
  }, [id]);

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
      <Button 
        variant="contained" 
        onClick={() => navigate('/projects')}
        style={{ marginBottom: '20px' }}
      >
        Back to Projects
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {project?.name}
          </Typography>
          {project?.description && (
            <Typography color="textSecondary">
              {project.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProjectDetail; 