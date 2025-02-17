import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Typography, Box, Paper, Divider } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';

const Home = () => {
  const navigate = useNavigate();

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
          <Box sx={{ mb: 3 }}>
            <img 
              src="/logo.svg" 
              alt="BuildTrack Logo" 
              style={{ 
                width: '80px',
                height: '80px',
                marginBottom: '16px'
              }} 
            />
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom>
            Bienvenido a BuildTrack
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4 }}>
            Gestiona tus proyectos de construcción de manera eficiente
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            justifyContent: 'center',
            mb: 4
          }}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
              startIcon={<PersonAddIcon />}
            >
              Registrarse
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
              startIcon={<LoginIcon />}
            >
              Iniciar Sesión
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>o</Divider>

          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/sandbox')}
            startIcon={<ScienceIcon />}
            sx={{ 
              mt: 2,
              width: '80%',
              py: 1.5,
              backgroundColor: '#9c27b0',
              '&:hover': {
                backgroundColor: '#7b1fa2',
              },
            }}
          >
            Acceder al Sandbox
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home; 
