import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';

const Sidebar = ({ drawerWidth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const isPathActive = (path) => {
    if (path === '/app') {
      // Para la ruta /app, solo debe estar activa cuando estamos exactamente en /app
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    // Para las demás rutas, usamos startsWith
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      text: 'Proyectos',
      icon: <FolderIcon />,
      path: '/app'
    },
    {
      text: 'Pagos',
      icon: <AccountBalanceIcon />,
      path: '/app/payments'
    },
    {
      text: 'Configuración',
      icon: <SettingsIcon />,
      path: '/app/settings'
    }
  ];

  const handleNavigate = (path) => {
    console.log('Sidebar - Navigating to:', path);
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigate(item.path)}
            selected={isPathActive(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: isPathActive(item.path) ? theme.palette.primary.main : 'inherit' 
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{ 
                color: isPathActive(item.path) ? theme.palette.primary.main : 'inherit',
                '& .MuiTypography-root': {
                  fontWeight: isPathActive(item.path) ? 600 : 400,
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 
