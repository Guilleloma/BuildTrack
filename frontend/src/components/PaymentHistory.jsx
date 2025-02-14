import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';

const PaymentHistory = ({ projectId, milestoneId, refreshTrigger }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!projectId || !milestoneId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/payments/milestone/${milestoneId}`);
        if (!response.ok) {
          throw new Error('Error al cargar los pagos');
        }
        const data = await response.json();
        setPayments(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err.message);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [projectId, milestoneId, refreshTrigger]);

  if (!projectId || !milestoneId) {
    return null;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (payments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        No hay pagos registrados para este hito.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2, position: 'relative' }}>
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {new Date(payment.timestamp).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell align="right">{payment.amount.toFixed(2)} €</TableCell>
                <TableCell>{payment.description || '-'}</TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PaymentHistory; 