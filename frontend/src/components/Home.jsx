import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Typography, Box, Paper } from '@mui/material';
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

            <Button
              variant="text"
              color="secondary"
              size="large"
              onClick={() => navigate('/sandbox')}
              startIcon={<ScienceIcon />}
              sx={{ 
                mt: 3,
                display: 'flex',
                mx: 'auto',
                alignItems: 'center',
                justifyContent: 'center'
              }}
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
