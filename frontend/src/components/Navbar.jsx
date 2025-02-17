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
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';

const Navbar = ({ drawerWidth }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isSandbox = location.pathname.startsWith('/sandbox');

  // Show New Project button in the projects list view or sandbox
  const showNewProjectButton = location.pathname === '/projects' || isSandbox;

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
        {showNewProjectButton && (
          <Button
            color="primary"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => navigate(isSandbox ? '/sandbox/projects/new' : '/app/projects/new')}
            sx={{ 
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
            }}
          >
            Nuevo Proyecto
          </Button>
        )}
        {isSandbox ? (
          <Button
            color="primary"
            startIcon={<HomeIcon />}
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ 
              ml: 2,
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
            }}
          >
            Volver al Inicio
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
            Cerrar Sesión
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 