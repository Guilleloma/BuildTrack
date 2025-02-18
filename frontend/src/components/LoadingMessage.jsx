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
          ¡Hey! Este es un prototipo en desarrollo 🚀
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          La primera vez el servidor necesita su café matutino ☕️ <br/>
          (puede tardar hasta 50 segundos en despertar)
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ fontStyle: 'italic' }}>
          ¡Gracias por tu paciencia! Estamos trabajando para hacer esto más rápido 💪
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoadingMessage; 
