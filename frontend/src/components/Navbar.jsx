import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Navbar = ({ drawerWidth }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar 
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
          }}
        >
          BuildTrack
        </Typography>
        <Button
          color="primary"
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => navigate('/projects/new')}
          sx={{ 
            borderRadius: '20px',
            textTransform: 'none',
            px: 3,
          }}
        >
          New Project
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 