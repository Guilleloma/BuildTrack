import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Box,
  Typography
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';

const Sidebar = ({ drawerWidth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSandbox = location.pathname.startsWith('/sandbox');

  const isPathActive = (path) => {
    if (isSandbox) {
      if (path === '/sandbox') {
        return location.pathname === '/sandbox' || location.pathname === '/sandbox/';
      }
      return location.pathname.startsWith(path);
    } else {
      if (path === '/app') {
        return location.pathname === '/app' || location.pathname === '/app/';
      }
      return location.pathname.startsWith(path);
    }
  };

  const menuItems = [
    {
      text: 'Projects',
      icon: <FolderIcon />,
      path: isSandbox ? '/sandbox' : '/app'
    },
    {
      text: 'Payments',
      icon: <AccountBalanceIcon />,
      path: isSandbox ? '/sandbox/payments' : '/app/payments'
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: isSandbox ? '/sandbox/settings' : '/app/settings'
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <img 
          src="/logo.svg" 
          alt="BuildTrack Logo" 
          style={{ 
            width: '40px',
            height: '40px',
            marginBottom: '8px'
          }} 
        />
        <Typography 
          variant="subtitle2" 
          color="primary"
          sx={{ 
            fontWeight: 600,
            color: isSandbox ? '#9c27b0' : theme.palette.primary.main
          }}
        >
          {isSandbox ? 'Sandbox Mode' : 'App Mode'}
        </Typography>
      </Box>

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
