import React, { useState, useEffect } from 'react';
import {
  Container,
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
  TextField,
  CircularProgress,
  Alert,
  Box,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: ''
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  // Fetch all payments and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, projectsRes] = await Promise.all([
          fetch('http://localhost:3000/payments'),
          fetch('http://localhost:3000/projects')
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate global statistics
  const statistics = {
    totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
    totalCount: payments.length,
    averagePayment: payments.length ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
  };

  // Calculate project-specific statistics
  const projectStats = projects.map(project => {
    // Get all payments for this project's milestones
    const projectPayments = payments.filter(payment => 
      payment.milestone?.project?._id === project._id
    );

    // Use the project's progress information directly from the project data
    const {
      taskCompletionPercentage = 0,
      paymentPercentage = 0,
      totalTasks = 0,
      completedTasks = 0,
      totalCost = 0,
      paidAmount = 0
    } = project.progress || {};

    return {
      ...project,
      totalPaid: paidAmount,
      totalCost,
      pendingAmount: totalCost - paidAmount,
      completionPercentage: paymentPercentage,
      taskCompletionPercentage,
      paymentCount: projectPayments.length,
      milestoneStats: project.milestones?.map(milestone => {
        const milestonePayments = payments.filter(p => p.milestone?._id === milestone._id);
        return {
          ...milestone,
          paidAmount: milestone.paidAmount || 0,
          pendingAmount: milestone.budget - (milestone.paidAmount || 0),
          completionPercentage: milestone.budget > 0 ? ((milestone.paidAmount || 0) / milestone.budget) * 100 : 0
        };
      }) || []
    };
  });

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    const searchString = `${payment.milestone?.project?.name || ''} ${payment.milestone?.name || ''} ${payment.description}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
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
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setEditFormData({
      amount: payment.amount,
      description: payment.description || '',
      paymentMethod: payment.paymentMethod
    });
  };

  const handleEditClose = () => {
    setEditingPayment(null);
    setEditFormData({
      amount: '',
      description: '',
      paymentMethod: ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/payments/${editingPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating payment');
      }

      // Refresh data
      const [paymentsRes, projectsRes] = await Promise.all([
        fetch('http://localhost:3000/payments'),
        fetch('http://localhost:3000/projects')
      ]);

      const [paymentsData, projectsData] = await Promise.all([
        paymentsRes.json(),
        projectsRes.json()
      ]);

      setPayments(paymentsData);
      setProjects(projectsData);
      handleEditClose();
      showMessage('Pago actualizado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (payment) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pago?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/payments/${payment._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting payment');
      }

      // Refresh data
      const [paymentsRes, projectsRes] = await Promise.all([
        fetch('http://localhost:3000/payments'),
        fetch('http://localhost:3000/projects')
      ]);

      const [paymentsData, projectsData] = await Promise.all([
        paymentsRes.json(),
        projectsRes.json()
      ]);

      setPayments(paymentsData);
      setProjects(projectsData);
      showMessage('Pago eliminado correctamente');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
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
        Payments Overview
      </Typography>

      {/* Global Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h5">
                {formatCurrency(statistics.totalPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Number of Payments
              </Typography>
              <Typography variant="h5">
                {statistics.totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Payment
              </Typography>
              <Typography variant="h5">
                {formatCurrency(statistics.averagePayment)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project-specific Payment Overview */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Payments by Project
      </Typography>
      
      {projectStats.map((project) => {
        const taskProgress = project.taskCompletionPercentage || 0;
        const paymentProgress = project.completionPercentage || 0;
        const showWarning = paymentProgress > taskProgress;
        const showPaymentNeeded = taskProgress > paymentProgress;

        return (
          <Paper 
            key={project._id}
            sx={{ 
              mb: 2, 
              p: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.01)'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {project.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/projects/${project._id}`)}
                    sx={{ ml: 1 }}
                  >
                    <Tooltip title="Ver detalles del proyecto">
                      <LaunchIcon fontSize="small" />
                    </Tooltip>
                  </IconButton>
                  {showWarning && (
                    <Tooltip title="El porcentaje de pago supera al porcentaje de tareas completadas">
                      <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    </Tooltip>
                  )}
                  {showPaymentNeeded && (
                    <Tooltip title="Hay más tareas completadas que pagos realizados">
                      <MonetizationOnIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="subtitle1">
                  {formatCurrency(project.totalPaid)} / {formatCurrency(project.totalCost)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(paymentProgress, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {project.paymentCount} {project.paymentCount === 1 ? 'pago' : 'pagos'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {paymentProgress.toFixed(1)}% complete
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}

      <Divider sx={{ my: 4 }} />

      {/* Search Field */}
      <Typography variant="h5" gutterBottom>
        Payment History
      </Typography>
      <TextField
        fullWidth
        label="Search payments"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Milestone</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center" width={120}>Actions</TableCell>
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
                <TableCell>{payment.milestone?.project?.name || 'Unknown Project'}</TableCell>
                <TableCell>{payment.milestone?.name || 'Unknown Milestone'}</TableCell>
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

      <Dialog open={!!editingPayment} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Pago</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Monto"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 0, step: "0.01" }}
              />

              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={editFormData.paymentMethod}
                  label="Método de Pago"
                  onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
                  <MenuItem value="BIZUM">Bizum</MenuItem>
                  <MenuItem value="PAYPAL">PayPal</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Descripción"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading || !editFormData.amount || parseFloat(editFormData.amount) <= 0}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
    </Container>
  );
};

export default PaymentsPage; 
