import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '../firebaseConfig';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';

const Navbar = ({ drawerWidth }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSandbox = location.pathname.startsWith('/sandbox');

  console.log('[Navbar] Current location:', {
    pathname: location.pathname,
    isSandbox
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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
          BuildTrack {isSandbox && '(Sandbox)'}
        </Typography>
        {isSandbox ? (
          <Button
            sx={{ 
              ml: 2,
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
              color: '#9c27b0',
              backgroundColor: '#fff',
              border: '1px solid #9c27b0',
              '&:hover': {
                backgroundColor: '#f3e5f5',
                border: '1px solid #7b1fa2',
                color: '#7b1fa2',
              },
            }}
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        ) : (
          <Button
            color="primary"
            startIcon={<LogoutIcon />}
            variant="outlined"
            onClick={handleLogout}
            sx={{ 
              ml: 2,
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
            }}
          >
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 