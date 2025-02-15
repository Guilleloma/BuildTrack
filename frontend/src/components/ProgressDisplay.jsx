import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
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

const ProgressBar = ({ value, type = 'tasks' }) => {
  const progressValue = isNaN(value) ? 0 : Math.min(value, 100);
  const colors = COLORS[type];
  
  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.background,
          '& .MuiLinearProgress-bar': {
            backgroundColor: colors.bar,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
};

const ProgressDisplay = ({ progress }) => {
  const {
    taskCompletionPercentage = 0,
    paymentPercentage = 0,
    totalTasks = 0,
    completedTasks = 0,
    totalCost = 0,
    paidAmount = 0,
  } = progress || {};

  const showWarning = paymentPercentage > taskCompletionPercentage;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Tareas */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskAltIcon 
              sx={{ 
                color: taskCompletionPercentage >= 100 ? COLORS.tasks.icon : 'text.secondary',
                fontSize: 20 
              }} 
            />
            <Typography variant="body1">
              {completedTasks}/{totalTasks}
            </Typography>
          </Box>
          {showWarning && (
            <Tooltip title="El porcentaje de pago supera al porcentaje de tareas completadas">
              <WarningIcon sx={{ ml: 1, fontSize: 20, color: 'warning.main' }} />
            </Tooltip>
          )}
        </Box>
        <ProgressBar value={taskCompletionPercentage} type="tasks" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {taskCompletionPercentage.toFixed(1)}% complete
        </Typography>
      </Box>

      {/* Pagos */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon 
              sx={{ 
                color: paymentPercentage >= 100 ? COLORS.payments.icon : 'text.secondary',
                fontSize: 20 
              }} 
            />
            <Typography variant="body1">
              {formatCurrency(paidAmount)} / {formatCurrency(totalCost)}
            </Typography>
          </Box>
        </Box>
        <ProgressBar value={paymentPercentage} type="payments" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {paymentPercentage.toFixed(1)}% complete
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProgressDisplay; 
