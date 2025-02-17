import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency } from '../utils/formatters';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../config';
import PaymentForm from './PaymentForm';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get payment ID from URL query params
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('id');

        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [paymentsRes, projectsRes] = await Promise.all([
          fetch(getApiUrl('/payments'), { headers }),
          fetch(getApiUrl('/projects'), { headers })
        ]);

        if (!paymentsRes.ok || !projectsRes.ok) {
          throw new Error('Error fetching data');
        }

        const [paymentsData, projectsData] = await Promise.all([
          paymentsRes.json(),
          projectsRes.json()
        ]);

        setPayments(paymentsData);
        setProjects(projectsData);

        // If we have a payment ID in the URL, find and open that payment for editing
        if (paymentId) {
          const paymentToEdit = paymentsData.find(p => p._id === paymentId);
          if (paymentToEdit && paymentToEdit.type === 'DISTRIBUTED') {
            // For distributed payments, we need to get the milestone info
            const milestones = paymentToEdit.distributions.map(dist => ({
              _id: dist.milestone._id,
              name: dist.milestone.name,
              amount: dist.amount
            }));
            
            setEditingPayment({
              ...paymentToEdit,
              milestones
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location]);

  // Calculate global statistics
  const statistics = {
    totalPayments: payments.reduce((sum, p) => sum + (p?.amount || 0), 0),
    totalCount: payments.length,
    averagePayment: payments.length ? payments.reduce((sum, p) => sum + (p?.amount || 0), 0) / payments.length : 0
  };

  // Calculate project-specific statistics
  const projectStats = projects.map(project => {
    if (!project?._id) return null;

    // Get all payments for this project's milestones
    const projectPayments = payments.filter(payment => {
      if (payment.type === 'DISTRIBUTED') {
        return payment.distributions?.some(dist => 
          dist?.milestone?.project?._id === project._id
        );
      }
      return payment?.milestone?.project?._id === project._id;
    });

    // Use the project's progress information directly from the project data
    const {
      taskCompletionPercentage = 0,
      paymentPercentage = 0,
      totalCost = 0,
      totalCostWithTax = 0,
      paidAmount = 0
    } = project.progress || {};

    const milestoneStats = (project.milestones || []).map(milestone => {
      if (!milestone) return null;
      
      const totalWithTax = milestone.hasTax 
        ? (milestone.budget || 0) * (1 + ((milestone.taxRate || 21) / 100))
        : (milestone.budget || 0);

      return {
        ...milestone,
        paidAmount: milestone.paidAmount || 0,
        totalWithTax,
        pendingAmount: totalWithTax - (milestone.paidAmount || 0),
        completionPercentage: totalWithTax > 0 ? ((milestone.paidAmount || 0) / totalWithTax) * 100 : 0
      };
    }).filter(Boolean);

    return {
      ...project,
      totalPaid: paidAmount || 0,
      totalCost: totalCost || 0,
      totalCostWithTax: totalCostWithTax || 0,
      pendingAmount: (totalCostWithTax || 0) - (paidAmount || 0),
      completionPercentage: paymentPercentage || 0,
      taskCompletionPercentage: taskCompletionPercentage || 0,
      paymentCount: projectPayments.length,
      milestoneStats
    };
  }).filter(Boolean);

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;
    
    let searchString = '';
    if (payment.type === 'DISTRIBUTED') {
      searchString = `${payment.distributions?.[0]?.milestone?.project?.name || ''} ${
        payment.distributions?.map(d => d?.milestone?.name || '').join(' ') || ''
      } ${payment.description || ''}`;
    } else {
      searchString = `${payment.milestone?.project?.name || ''} ${payment.milestone?.name || ''} ${payment.description || ''}`;
    }
    
    return searchString.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  const showMessage = (message, severity = 'success') => {
    console.log(`${severity}: ${message}`); // Temporary logging until we implement proper message display
  };

  const handleEditClick = async (payment) => {
    console.log('handleEditClick called with payment:', payment);
    try {
      if (payment.type === 'DISTRIBUTED') {
        console.log('Payment is distributed, fetching full payment...');
        // Obtener el pago completo con todas sus distribuciones
        const paymentResponse = await fetch(`/payments/${payment._id}`);
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
        console.log('Payment prepared for form:', paymentForForm);

        setEditingPayment(paymentForForm);
      } else {
        console.log('Setting regular payment for editing');
        setEditingPayment(payment);
      }
    } catch (err) {
      console.error('Error in handleEditClick:', err);
      showMessage(err.message, 'error');
    }
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

      // Refetch payments to update the list
      const paymentsRes = await fetch(getApiUrl('/payments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!paymentsRes.ok) throw new Error('Error al recargar los pagos');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);

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

      // Refetch payments to update the list
      const paymentsRes = await fetch(getApiUrl('/payments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!paymentsRes.ok) throw new Error('Error al recargar los pagos');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);

      showMessage('Pago eliminado correctamente');
    } catch (err) {
      console.error('Error deleting payment:', err);
      showMessage('Error al eliminar el pago', 'error');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Pagos
      </Typography>

      <TextField
        fullWidth
        label="Buscar pagos..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        placeholder="Buscar por proyecto, hito o descripción..."
      />

      <Box sx={{ mb: 4 }}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Pagado
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(statistics.totalPayments)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Número de Pagos
                </Typography>
                <Typography variant="h4">
                  {statistics.totalCount}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Promedio por Pago
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(statistics.averagePayment)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Hitos</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Método</TableCell>
              <TableCell align="center" width={120}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((payment) => (
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
                <TableCell>{payment.projectName || 'Unknown Project'}</TableCell>
                <TableCell>
                  {payment.milestonesInfo?.map((info, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2">
                        {info.name}: {formatCurrency(info.amount)}
                      </Typography>
                    </Box>
                  ))}
                </TableCell>
                <TableCell>{payment.description || '-'}</TableCell>
                <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
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
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editingPayment && (
        <PaymentForm
          open={true}
          onClose={() => {
            console.log('Closing payment form');
            setEditingPayment(null);
            navigate('/payments', { replace: true });
          }}
          onSubmit={handleEditSubmit}
          payment={editingPayment}
          project={editingPayment.project}
        />
      )}
    </Container>
  );
};

export default PaymentsPage; 
