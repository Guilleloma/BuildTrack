import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { formatCurrency } from '../utils/formatters';

const ProgressDisplay = ({ progress, type = 'milestone' }) => {
  const {
    taskCompletionPercentage = 0,
    paymentPercentage = 0,
    totalTasks = 0,
    completedTasks = 0,
    totalCost = 0,
    totalTax = 0,
    paidBase = 0,
    paidTax = 0,
    totalCostWithTax = 0,
    paidAmount = 0
  } = progress || {};

  const hasTax = totalTax > 0;
  const basePaymentPercentage = (paidBase / totalCost) * 100;
  const taxPaymentPercentage = hasTax ? (paidTax / totalTax) * 100 : 0;

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      {/* Tasks Progress */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Tareas Completadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedTasks}/{totalTasks} ({Math.round(taskCompletionPercentage)}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(taskCompletionPercentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#2196f3',
            }
          }}
        />
      </Box>

      {/* Base Amount Progress */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Base ({formatCurrency(totalCost)})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(paidBase)} ({Math.round(basePaymentPercentage)}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(basePaymentPercentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4caf50',
            }
          }}
        />
      </Box>

      {/* Tax Progress */}
      {hasTax && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              IVA ({formatCurrency(totalTax)})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(paidTax)} ({Math.round(taxPaymentPercentage)}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(taxPaymentPercentage, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff9800',
              }
            }}
          />
        </Box>
      )}

      {/* Total Summary */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" align="right">
          Total Pagado: {formatCurrency(paidAmount)} / {formatCurrency(totalCostWithTax)} ({Math.round(paymentPercentage)}%)
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressDisplay; 
