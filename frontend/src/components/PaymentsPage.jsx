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
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProject, setExpandedProject] = useState(null);
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
    const projectPayments = payments.filter(p => 
      project.milestones?.some(m => m._id === p.milestone?._id)
    );
    const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCost = project.progress?.totalCost || 0;
    const pendingAmount = totalCost - totalPaid;
    const completionPercentage = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;

    const milestoneStats = project.milestones?.map(milestone => {
      const milestonePayments = payments.filter(p => p.milestone?._id === milestone._id);
      const paidAmount = milestonePayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = milestone.budget - paidAmount;
      return {
        ...milestone,
        paidAmount,
        pendingAmount,
        completionPercentage: milestone.budget > 0 ? (paidAmount / milestone.budget) * 100 : 0
      };
    }) || [];

    return {
      ...project,
      totalPaid,
      totalCost,
      pendingAmount,
      completionPercentage,
      paymentCount: projectPayments.length,
      milestoneStats
    };
  });

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    const project = projects.find(p => p._id === payment.projectId);
    const milestone = project?.milestones?.find(m => m._id === payment.milestoneId);
    const searchString = `${project?.name} ${milestone?.name} ${payment.description}`.toLowerCase();
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
      
      {projectStats.map((project) => (
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
              </Box>
              <Typography variant="subtitle1">
                {formatCurrency(project.totalPaid)} / {formatCurrency(project.totalCost)}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(project.completionPercentage, 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {project.paymentCount} {project.paymentCount === 1 ? 'pago' : 'pagos'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {project.completionPercentage.toFixed(1)}% complete
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}

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
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((payment) => {
              const project = projects.find(p => 
                p.milestones?.some(m => m._id === payment.milestone?._id)
              );
              const milestone = project?.milestones?.find(m => m._id === payment.milestone?._id);
              
              return (
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
                  <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                  <TableCell>{milestone?.name || 'Unknown Milestone'}</TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PaymentsPage; 
