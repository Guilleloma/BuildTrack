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
import LoadingMessage from './LoadingMessage';
import { useAuth } from '../contexts/AuthContext';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isSandbox = location.pathname.startsWith('/sandbox');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get payment ID from URL query params
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('id');

        let headers = {
          'Content-Type': 'application/json'
        };

        // Solo añadimos el token si no estamos en modo sandbox
        if (!isSandbox) {
          const token = localStorage.getItem('token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const [paymentsRes, projectsRes] = await Promise.all([
          fetch(getApiUrl(`/payments${isSandbox ? '?mode=sandbox' : ''}`), { headers }),
          fetch(getApiUrl(`/projects${isSandbox ? '?mode=sandbox' : ''}`), { headers })
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
  }, [location, isSandbox]);

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
    console.log('=== INICIO handleEditClick ===');
    console.log('Payment recibido:', JSON.stringify(payment, null, 2));
    console.log('Tipo de pago:', payment.type);
    console.log('Milestone en el pago:', JSON.stringify(payment.milestone, null, 2));
    
    try {
        let headers = {
          'Content-Type': 'application/json'
        };

        if (!isSandbox) {
          const token = localStorage.getItem('token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        if (payment.type === 'DISTRIBUTED') {
            console.log('Payment is distributed, fetching full payment...');
            const paymentResponse = await fetch(getApiUrl(`/payments/${payment._id}`), {
                headers
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
            console.log('=== Procesando pago normal ===');
            if (!payment.milestone) {
                console.error('Error: No hay milestone en el pago');
                throw new Error('No se encontró información del milestone en el pago');
            }

            const milestoneUrl = getApiUrl(
              `/projects/${payment.milestone.project._id}/milestones/${payment.milestone._id}${isSandbox ? '?mode=sandbox' : ''}`
            );
            console.log('URL del milestone:', milestoneUrl);
            
            const milestoneResponse = await fetch(milestoneUrl, { headers });
            
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

  const handleEditSubmit = async (formData) => {
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(
        getApiUrl(`/payments/${editingPayment._id}${isSandbox ? '?mode=sandbox' : ''}`),
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error('Error updating payment');
      }

      // Refetch payments to update the list
      const paymentsRes = await fetch(
        getApiUrl(`/payments${isSandbox ? '?mode=sandbox' : ''}`),
        { headers }
      );
      if (!paymentsRes.ok) throw new Error('Error al recargar los pagos');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);
      setEditingPayment(null);
      showMessage('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteClick = async (payment, milestoneId = null) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      return;
    }

    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const url = payment.type === 'DISTRIBUTED' && milestoneId
        ? `${getApiUrl(`/payments/${payment._id}`)}?milestoneId=${milestoneId}${isSandbox ? '&mode=sandbox' : ''}`
        : getApiUrl(`/payments/${payment._id}${isSandbox ? '?mode=sandbox' : ''}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el pago');
      }

      // Refetch payments to update the list
      const paymentsRes = await fetch(
        getApiUrl(`/payments${isSandbox ? '?mode=sandbox' : ''}`),
        { headers }
      );
      if (!paymentsRes.ok) throw new Error('Error al recargar los pagos');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);

      showMessage('Pago eliminado correctamente');
    } catch (err) {
      console.error('Error deleting payment:', err);
      showMessage('Error al eliminar el pago', 'error');
    }
  };

  const handleProjectClick = (projectId, milestoneId = null) => {
    const basePath = isSandbox ? '/sandbox' : '/app';
    if (milestoneId) {
      navigate(`${basePath}/projects/${projectId}?milestone=${milestoneId}`);
    } else {
      navigate(`${basePath}/projects/${projectId}`);
    }
  };

  if (loading) {
    return <LoadingMessage message="Loading payment history..." />;
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        {/* Estadísticas globales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Payments</Typography>
                <Typography variant="h4">{formatCurrency(statistics.totalPayments)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Number of Payments</Typography>
                <Typography variant="h4">{statistics.totalCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Average Payment</Typography>
                <Typography variant="h4">{formatCurrency(statistics.averagePayment)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Búsqueda */}
        <TextField
          fullWidth
          label="Search payments"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 4 }}
        />

        {/* Lista de proyectos */}
        {projectStats.map(project => (
          <Accordion key={project._id} sx={{ mb: 2 }}>
            <AccordionSummary>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    {project.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectClick(project._id);
                    }}
                  >
                    <LaunchIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography>
                    {formatCurrency(project.totalPaid)} / {formatCurrency(project.totalCostWithTax)}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 140 }}>
                    Paid: {Math.round(project.completionPercentage)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={project.completionPercentage}
                    sx={{ 
                      flexGrow: 1,
                      ml: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4caf50',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ minWidth: 140 }}>
                    Completed: {Math.round(project.taskCompletionPercentage)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={project.taskCompletionPercentage}
                    sx={{ 
                      flexGrow: 1,
                      ml: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2196f3',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Tabla de hitos */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Milestone</TableCell>
                      <TableCell align="right">Budget</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Pending</TableCell>
                      <TableCell align="right">Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.milestoneStats.map(milestone => (
                      <TableRow key={milestone._id}>
                        <TableCell>{milestone.name}</TableCell>
                        <TableCell align="right">{formatCurrency(milestone.totalWithTax)}</TableCell>
                        <TableCell align="right">{formatCurrency(milestone.paidAmount)}</TableCell>
                        <TableCell align="right">{formatCurrency(milestone.pendingAmount)}</TableCell>
                        <TableCell align="right">{Math.round(milestone.completionPercentage)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Historial de pagos */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Payment History</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Milestone</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map(payment => (
                <TableRow key={payment._id}>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {payment.type === 'DISTRIBUTED' ? (
                      payment.distributions[0]?.milestone?.project?.name
                    ) : (
                      payment.milestone?.project?.name
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.type === 'DISTRIBUTED' ? (
                      <Tooltip title={payment.distributions.map(d => 
                        `${d.milestone?.name}: ${formatCurrency(d.amount)}`
                      ).join('\n')}>
                        <Typography>Multiple Milestones</Typography>
                      </Tooltip>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {payment.milestone?.name}
                        <IconButton 
                          size="small"
                          onClick={() => {
                            const projectId = payment.milestone?.project?._id;
                            const milestoneId = payment.milestone?._id;
                            if (projectId && milestoneId) {
                              handleProjectClick(projectId, milestoneId);
                            }
                          }}
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getPaymentMethodLabel(payment.paymentMethod)}
                      color={getPaymentMethodColor(payment.paymentMethod)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(payment)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(payment)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal de edición de pago */}
      {editingPayment && (
        <PaymentForm
          open={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          onSubmit={handleEditSubmit}
          payment={editingPayment}
          milestone={editingPayment.milestone}
          project={editingPayment.project}
        />
      )}
    </Container>
  );
};

export default PaymentsPage;