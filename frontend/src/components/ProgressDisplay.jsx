import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Grid,
  Tooltip,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import { formatCurrency } from '../utils/formatters';

const COLORS = {
  tasks: {
    background: '#e3f2fd',
    bar: '#0288d1',
    icon: '#1976d2'
  },
  payments: {
    background: '#e8f5e9',
    bar: '#2e7d32',
    icon: '#2e7d32'
  }
};

const ProgressBar = ({ value, type = 'tasks', variant = 'milestone' }) => {
  // Ensure value is a valid number, default to 0 if NaN
  const progressValue = isNaN(value) ? 0 : value;
  
  const colors = COLORS[type];
  
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: variant === 'project' ? 12 : 8,
          borderRadius: 5,
          backgroundColor: colors.background,
          '& .MuiLinearProgress-bar': {
            backgroundColor: colors.bar,
            borderRadius: 5,
            transition: 'transform 0.4s ease',
          },
          boxShadow: variant === 'project' ? '0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
        }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          position: 'absolute',
          right: -35,
          top: variant === 'project' ? 0 : -2,
          minWidth: 30,
          fontWeight: variant === 'project' ? 600 : 500,
        }}
      >
        {Math.round(progressValue)}%
      </Typography>
    </Box>
  );
};

const ProgressDisplay = ({ progress, variant = 'default', type = 'milestone' }) => {
  const {
    taskCompletionPercentage = 0,
    paymentPercentage = 0,
    totalTasks = 0,
    completedTasks = 0,
    totalCost = 0,
    paidAmount = 0,
  } = progress || {};

  const displayVariant = type === 'project' ? 'project' : 'milestone';

  const TasksCount = () => {
    if (totalTasks === 0) {
      return (
        <Typography 
          variant={type === 'project' ? 'body1' : 'body2'} 
          color="text.secondary"
          fontWeight={type === 'project' ? 500 : 400}
          sx={{ minWidth: 45, textAlign: 'right' }}
        >
          Sin tareas
        </Typography>
      );
    }
    return (
      <Tooltip title="Tareas completadas / Total de tareas">
        <Typography 
          variant={type === 'project' ? 'body1' : 'body2'} 
          color="text.secondary"
          fontWeight={type === 'project' ? 500 : 400}
          sx={{ minWidth: 45, textAlign: 'right' }}
        >
          {completedTasks}/{totalTasks}
        </Typography>
      </Tooltip>
    );
  };

  const PaymentAmount = () => {
    if (totalCost === 0) {
      return (
        <Typography 
          variant={type === 'project' ? 'body1' : 'body2'} 
          color="text.secondary"
          fontWeight={type === 'project' ? 500 : 400}
          sx={{ minWidth: 120, textAlign: 'right' }}
        >
          Sin presupuesto
        </Typography>
      );
    }
    return (
      <Tooltip title="Monto pagado / Costo total">
        <Typography 
          variant={type === 'project' ? 'body1' : 'body2'} 
          color="text.secondary"
          fontWeight={type === 'project' ? 500 : 400}
          sx={{ minWidth: 120, textAlign: 'right' }}
        >
          {formatCurrency(paidAmount)}/{formatCurrency(totalCost)}
        </Typography>
      </Tooltip>
    );
  };

  return (
    <Paper
      elevation={variant === 'compact' ? 0 : 1}
      sx={{
        p: variant === 'compact' ? 1 : 2,
        mb: variant === 'compact' ? 1 : 2,
        backgroundColor: type === 'project' ? '#fafafa' : 'white',
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TaskAltIcon 
              sx={{ 
                mr: 1,
                fontSize: type === 'project' ? 28 : 24,
                opacity: variant === 'compact' ? 0.9 : 1,
                color: COLORS.tasks.icon,
              }} 
            />
            <Typography 
              variant={type === 'project' ? 'h6' : (variant === 'compact' ? 'body2' : 'body1')}
              color="text.primary"
              sx={{ 
                fontWeight: type === 'project' ? 600 : (variant === 'compact' ? 400 : 500)
              }}
            >
              Tareas Completadas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1, mr: 4 }}>
              <ProgressBar 
                value={totalTasks === 0 ? 0 : taskCompletionPercentage} 
                type="tasks"
                variant={displayVariant}
              />
            </Box>
            <TasksCount />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PaymentIcon 
              sx={{ 
                mr: 1,
                fontSize: type === 'project' ? 28 : 24,
                opacity: variant === 'compact' ? 0.9 : 1,
                color: paymentPercentage >= 100 ? COLORS.payments.icon : 'text.secondary',
              }} 
            />
            <Typography 
              variant={type === 'project' ? 'h6' : (variant === 'compact' ? 'body2' : 'body1')}
              color="text.primary"
              sx={{ 
                fontWeight: type === 'project' ? 600 : (variant === 'compact' ? 400 : 500)
              }}
            >
              Pagos Realizados
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, mr: 4 }}>
              <ProgressBar 
                value={totalCost === 0 ? 0 : paymentPercentage} 
                type="payments"
                variant={displayVariant}
              />
            </Box>
            <PaymentAmount />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProgressDisplay; 
