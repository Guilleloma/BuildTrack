import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/payments/milestone/${milestoneId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Error al cargar los pagos');
      }
      const data = await response.json();
      
      // Asegurarnos de que los pagos tienen la estructura correcta
      const validPayments = data.filter(payment => payment && payment._id);
      setPayments(validPayments);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [projectId, milestoneId, refreshTrigger]);

  const handleEditClick = async (payment) => {
    console.log('=== INICIO handleEditClick en PaymentHistory ===');
    console.log('Payment completo:', JSON.stringify(payment, null, 2));
    console.log('Milestone en el payment:', JSON.stringify(payment.milestone, null, 2));
    console.log('Project en el milestone:', JSON.stringify(payment.milestone?.project, null, 2));
    
    try {
        if (payment.type === 'DISTRIBUTED') {
            console.log('Payment is distributed, fetching full payment...');
            // Obtener el pago completo con todas sus distribuciones
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
            console.log('Full payment received:', JSON.stringify(fullPaymentData, null, 2));

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
            console.log('Payment prepared for form:', JSON.stringify(paymentForForm, null, 2));

            setEditingPayment(paymentForForm);
        } else {
            console.log('=== Procesando pago normal ===');
            if (!payment.milestone) {
                console.error('Error: No hay milestone en el pago');
                throw new Error('No se encontró información del milestone en el pago');
            }
            if (!payment.milestone.project || !payment.milestone.project._id) {
                console.error('Error: No hay project._id en el milestone');
                throw new Error('No se encontró información del proyecto en el milestone');
            }
            if (!payment.milestone._id) {
                console.error('Error: No hay _id en el milestone');
                throw new Error('No se encontró ID del milestone');
            }

            console.log('Project ID:', payment.milestone.project._id);
            console.log('Milestone ID:', payment.milestone._id);
            
            // Obtener la información completa del milestone
            const token = localStorage.getItem('token');
            console.log('Token obtenido:', token ? 'Sí' : 'No');
            
            const milestoneUrl = getApiUrl(`/projects/${payment.milestone.project._id}/milestones/${payment.milestone._id}`);
            console.log('URL del milestone:', milestoneUrl);
            
            const milestoneResponse = await fetch(milestoneUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Respuesta del milestone:', {
                ok: milestoneResponse.ok,
                status: milestoneResponse.status
            });
            
            if (!milestoneResponse.ok) {
                const errorText = await milestoneResponse.text();
                console.error('Error en la respuesta del milestone:', errorText);
                throw new Error('Error al obtener la información del milestone');
            }
            
            const milestoneData = await milestoneResponse.json();
            console.log('Datos del milestone obtenidos:', JSON.stringify(milestoneData, null, 2));
            
            const paymentForForm = {
                _id: payment._id,
                amount: payment.amount.toString(),
                description: payment.description || '',
                paymentMethod: payment.paymentMethod,
                type: 'SINGLE',
                milestone: milestoneData
            };
            
            console.log('Datos preparados para el formulario:', JSON.stringify(paymentForForm, null, 2));
            setEditingPayment(paymentForForm);
            console.log('EditingPayment establecido');
        }
    } catch (err) {
        console.error('Error detallado en handleEditClick:', err);
        console.error('Stack trace:', err.stack);
        showMessage(err.message, 'error');
    }
    console.log('=== FIN handleEditClick ===');
  };

  const handleEditClose = () => {
    setEditingPayment(null);
  };

  const handleEditSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/payments/${editingPayment._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el pago');
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
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/payments/${payment._id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el pago');
      }

      await fetchPayments();
      if (onPaymentDeleted) {
        onPaymentDeleted();
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
              <TableCell>Método de Pago</TableCell>
              <TableCell align="center" width={140}>Acciones</TableCell>
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
                      <Tooltip title="Parte de un pago distribuido">
                        <Chip
                          label="Distribuido"
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
                    {payment.type === 'DISTRIBUTED' ? (
                      <>
                        <Tooltip title="Ver/Editar pago distribuido">
                          <IconButton
                            size="small"
                            onClick={() => handleDistributedPaymentClick(payment)}
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
                      </>
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(payment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(payment)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
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
            milestone={editingPayment.milestone}
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