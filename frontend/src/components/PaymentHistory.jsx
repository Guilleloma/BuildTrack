import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import { formatCurrency } from '../utils/formatters';
import { getApiUrl } from '../config';
import PaymentForm from './PaymentForm';
import AddIcon from '@mui/icons-material/Add';

const getPaymentMethodLabel = (method) => {
  const labels = {
    'EFECTIVO': 'Efectivo',
    'TRANSFERENCIA_BANCARIA': 'Transferencia',
    'BIZUM': 'Bizum',
    'PAYPAL': 'PayPal'
  };
  return labels[method] || method;
};

const getPaymentMethodColor = (method) => {
  const colors = {
    'EFECTIVO': 'success',
    'TRANSFERENCIA_BANCARIA': 'primary',
    'BIZUM': 'info',
    'PAYPAL': 'secondary'
  };
  return colors[method] || 'default';
};

const PaymentHistory = ({ projectId, milestoneId, refreshTrigger, onPaymentDeleted }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isSandbox = location.pathname.startsWith('/sandbox');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: ''
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [distributedPayment, setDistributedPayment] = useState(null);

  const showMessage = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const fetchPayments = async () => {
    if (!projectId || !milestoneId) return;
    
    setLoading(true);
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`payments/milestone/${milestoneId}`, isSandbox), {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error loading payments');
      }

      const data = await response.json();
      const validPayments = data.filter(payment => payment && payment._id);
      setPayments(validPayments);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Error loading payments. Please try again.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [projectId, milestoneId, refreshTrigger]);

  const handleEditClick = async (payment) => {
    console.log('=== Starting handleEditClick in PaymentHistory ===');
    console.log('Payment:', JSON.stringify(payment, null, 2));
    
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (payment.type === 'DISTRIBUTED') {
        console.log('Processing distributed payment');
        const paymentResponse = await fetch(getApiUrl(`payments/${payment._id}`, isSandbox), {
          headers,
          credentials: 'include'
        });

        if (!paymentResponse.ok) {
          throw new Error('Error loading payment details');
        }

        const fullPaymentData = await paymentResponse.json();
        const fullPayment = fullPaymentData.payment;
        const project = fullPaymentData.project;

        if (!fullPayment?.distributions?.[0]?.milestone) {
          throw new Error('Missing milestone information in payment');
        }

        const paymentForForm = {
          _id: fullPayment._id,
          amount: fullPayment.amount.toString(),
          description: fullPayment.description || '',
          paymentMethod: fullPayment.paymentMethod,
          type: 'DISTRIBUTED',
          project,
          distributions: fullPayment.distributions.map(dist => ({
            milestoneId: dist.milestone._id,
            amount: dist.amount.toString(),
            name: dist.milestone.name
          }))
        };

        setEditingPayment(paymentForForm);
      } else {
        console.log('Processing single payment');
        if (!payment.milestone) {
          throw new Error('Missing milestone information');
        }

        const milestoneUrl = getApiUrl(
          `projects/${payment.milestone.project._id}/milestones/${payment.milestone._id}`,
          isSandbox
        );
        
        const milestoneResponse = await fetch(milestoneUrl, {
          headers,
          credentials: 'include'
        });
        
        if (!milestoneResponse.ok) {
          throw new Error('Error loading milestone details');
        }
        
        const milestoneData = await milestoneResponse.json();
        
        const paymentForForm = {
          _id: payment._id,
          amount: payment.amount.toString(),
          description: payment.description || '',
          paymentMethod: payment.paymentMethod,
          type: 'SINGLE',
          milestone: milestoneData
        };
        
        setEditingPayment(paymentForForm);
      }
    } catch (err) {
      console.error('Error in handleEditClick:', err);
      showMessage(err.message, 'error');
    }
  };

  const handleEditClose = () => {
    setEditingPayment(null);
  };

  const handleEditSubmit = async (formData) => {
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`payments/${editingPayment._id}`, isSandbox), {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el pago');
      }

      await fetchPayments();
      setEditingPayment(null);
      showMessage('Pago actualizado correctamente');
    } catch (err) {
      console.error('Error updating payment:', err);
      showMessage('Error al actualizar el pago', 'error');
    }
  };

  const handleDeleteClick = async (payment) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      return;
    }

    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = payment.type === 'DISTRIBUTED' && milestoneId
        ? `${getApiUrl(`payments/${payment._id}`, isSandbox)}?milestoneId=${milestoneId}`
        : getApiUrl(`payments/${payment._id}`, isSandbox);

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el pago');
      }

      await fetchPayments();
      if (onPaymentDeleted) {
        await onPaymentDeleted();
      }
      showMessage('Pago eliminado correctamente');
    } catch (err) {
      console.error('Error deleting payment:', err);
      showMessage('Error al eliminar el pago', 'error');
    }
  };

  const handleDistributedPaymentClick = async (payment) => {
    try {
      if (!payment?._id) {
        throw new Error('ID de pago no válido');
      }

      console.log('Fetching distributed payment:', payment._id);
      const token = localStorage.getItem('token');
      const paymentResponse = await fetch(getApiUrl(`/payments/${payment._id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!paymentResponse.ok) {
        throw new Error('Error al obtener el pago');
      }
      const fullPaymentData = await paymentResponse.json();
      console.log('Full payment data received:', fullPaymentData);

      const fullPayment = fullPaymentData.payment;
      const project = fullPaymentData.project;

      if (!fullPayment?.distributions?.[0]?.milestone) {
        throw new Error('No se encontró información del milestone en el pago');
      }

      // Preparar el pago con el formato correcto para el PaymentForm
      const paymentForForm = {
        _id: fullPayment._id,
        amount: fullPayment.amount.toString(),
        description: fullPayment.description || '',
        paymentMethod: fullPayment.paymentMethod,
        type: 'DISTRIBUTED',
        project,
        distributions: fullPayment.distributions.map(dist => ({
          milestoneId: dist.milestone._id,
          amount: dist.amount.toString(),
          name: dist.milestone.name
        }))
      };

      setDistributedPayment(paymentForForm);
    } catch (err) {
      console.error('Error in handleDistributedPaymentClick:', err);
      showMessage(err.message, 'error');
    }
  };

  const handleDistributedPaymentSubmit = async (formData) => {
    try {
      setLoading(true);
      
      const dataToSend = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        type: 'DISTRIBUTED',
        distributions: formData.distributions.map(dist => ({
          milestoneId: dist.milestoneId,
          amount: parseFloat(dist.amount)
        }))
      };

      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/payments/${distributedPayment._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Error updating payment');
      }

      await fetchPayments();
      if (onPaymentDeleted) {
        await onPaymentDeleted();
      }
      setDistributedPayment(null);
      showMessage('Pago distribuido actualizado correctamente');
    } catch (err) {
      console.error('Error updating distributed payment:', err);
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId || !milestoneId) {
    return null;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (payments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        No payments registered for this milestone.
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
      <Typography variant="h6" gutterBottom>
        Payments Made
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell align="center" width={140}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    {payment.type === 'DISTRIBUTED' && (
                      <Tooltip title="Part of a distributed payment">
                        <Chip
                          label="Distributed"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                      </Tooltip>
                    )}
                    {formatCurrency(payment.amount)}
                  </Box>
                </TableCell>
                <TableCell>{payment.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={getPaymentMethodLabel(payment.paymentMethod)}
                    color={getPaymentMethodColor(payment.paymentMethod)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title={payment.type === 'DISTRIBUTED' ? 'Editar pago distribuido' : 'Editar pago'}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(payment)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(payment)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editingPayment && (
        <>
          {console.log('Renderizando PaymentForm con:', {
            open: !!editingPayment,
            payment: editingPayment,
            milestone: editingPayment.milestone
          })}
          <PaymentForm
            open={!!editingPayment}
            onClose={handleEditClose}
            onSubmit={handleEditSubmit}
            payment={editingPayment}
            milestone={editingPayment.type === 'SINGLE' ? editingPayment.milestone : null}
            project={editingPayment.type === 'DISTRIBUTED' ? editingPayment.project : editingPayment.milestone?.project}
          />
        </>
      )}

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentHistory; 