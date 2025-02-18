import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Container
} from '@mui/material';

const LoadingMessage = ({ message = "Waking up the server! 🌅" }) => {
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
          Hey! This is a prototype running on freemium servers 🚀
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Sometimes it takes a nap when nobody's around and needs about 50 seconds to wake up 😴
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ fontStyle: 'italic' }}>
          Thanks for your patience (I'm not working on making it faster) 🙈
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoadingMessage; 
