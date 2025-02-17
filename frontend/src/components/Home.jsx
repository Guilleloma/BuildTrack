import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Typography, Box, Paper } from '@mui/material';

const Home = () => {
  console.log('Home component rendering');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Bienvenido a BuildTrack
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4 }}>
            Gestiona tus proyectos de construcción de manera eficiente
          </Typography>

          <Box sx={{ '& > button': { m: 1 } }}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Registrarse
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </Button>

            <Button
              variant="text"
              color="primary"
              size="large"
              onClick={() => navigate('/sandbox')}
              sx={{ mt: 2, display: 'block', mx: 'auto' }}
            >
              Acceder al Sandbox
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home; 
