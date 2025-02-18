import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Container
} from '@mui/material';

const LoadingMessage = ({ message = "¡Despertando al servidor! 🌅" }) => {
  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3}
        sx={{
          p: 3,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold' }}>
          {message}
        </Typography>
        <Typography variant="body1" align="center" color="primary">
          ¡Hey! Es un prototipo en desarrollo en servidores freemium 🚀
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          A veces se va a echar la siesta si no hay nadie y le cuesta como 50 segundos despertarse 😴
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ fontStyle: 'italic' }}>
          Gracias por tu paciencia (No estoy trabajando por hacerlo más rápido) 🙈
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoadingMessage; 
